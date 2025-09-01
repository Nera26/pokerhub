import { io, Socket } from 'socket.io-client';
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import { performance, monitorEventLoopDelay } from 'perf_hooks';
import { createServer } from 'http';
import * as fs from 'fs';
import { join } from 'path';
import { metrics } from '@opentelemetry/api';
import { RoomManager } from './room.service';
import type { GameAction } from '@shared/types';
import type { InternalGameState } from './engine';

interface HarnessOptions {
  sockets: number;
  tables: number;
  wsUrl: string;
  packetLoss: number;
  jitterMs: number;
  ackP95: number;
  duration: number;
  gcP95: number;
}

class Histogram {
  private readonly values: number[] = [];

  record(v: number) {
    this.values.push(v);
  }

  /** Return percentile using nearest-rank. */
  percentile(p: number): number {
    if (this.values.length === 0) return 0;
    const sorted = [...this.values].sort((a, b) => a - b);
    const rank = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(rank, sorted.length - 1))];
  }
}

interface AckTracker {
  start: number;
  resolve: (ms: number) => void;
  timeout: NodeJS.Timeout;
}

export class GameGatewaySoakHarness {
  private readonly opts: HarnessOptions;
  private readonly histogram = new Histogram();
  private readonly trackers = new Map<string, AckTracker>();
  private readonly metricsPath = join(
    __dirname,
    '../../../infra/metrics/soak_gc.jsonl',
  );
  private readonly eld = monitorEventLoopDelay();
  private dropped = 0;
  private replayFailures = 0;
  private readonly rssSamples: number[] = [];
  private metricsServer?: ReturnType<typeof createServer>;
  private lastElu = performance.eventLoopUtilization();
  private roomMgr = new RoomManager();

  private static readonly meter = metrics.getMeter('game');
  private static readonly droppedCounter =
    GameGatewaySoakHarness.meter.createCounter?.('soak_dropped_frames_total', {
      description: 'Frames dropped due to missed ACKs',
    }) ?? ({ add() {} } as { add(n: number, attrs?: Record<string, unknown>): void });
  private static readonly replayCounter =
    GameGatewaySoakHarness.meter.createCounter?.('soak_replay_failures_total', {
      description: 'Room replay mismatches after crash',
    }) ?? ({ add() {} } as { add(n: number, attrs?: Record<string, unknown>): void });

  constructor(options?: Partial<HarnessOptions>) {
    this.opts = {
      sockets: Number(process.env.SOCKETS ?? 10000),
      tables: Number(process.env.TABLES ?? 10000),
      wsUrl: process.env.WS_URL ?? 'ws://localhost:3001/game',
      packetLoss: Number(process.env.PACKET_LOSS ?? 0.05),
      jitterMs: Number(process.env.JITTER_MS ?? 200),
      ackP95: Number(process.env.ACK_P95_MS ?? 120),
      duration: Number(process.env.DURATION_SEC ?? 24 * 60 * 60),
      gcP95: Number(process.env.GC_P95_MS ?? 50),
      ...options,
    };
  }

  /** Configure toxiproxy with loss and latency. */
  setupNetworkImpairment() {
    spawnSync('bash', ['-c', `./load/toxiproxy.sh`], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PACKET_LOSS: String(this.opts.packetLoss),
        LATENCY_MS: String(this.opts.jitterMs),
      },
    });
  }

  private createAction(tableId: string, playerId: string): GameAction {
    return {
      version: '1',
      tableId,
      playerId,
      type: 'fold',
    } as GameAction;
  }

  private startMetricsServer() {
    const port = Number(process.env.METRICS_PORT ?? 4000);
    this.metricsServer = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          rssBytes: process.memoryUsage().rss,
          gcPauseP95: this.eld.percentile(95) / 1e6,
        }),
      );
    }).listen(port);
  }

  /** Spawn a socket and perform one action measuring ACK latency. */
  private spawnBot(id: number) {
    const tableId = `table-${id % this.opts.tables}`;
    const playerId = `player-${id}`;
    const socket: Socket = io(this.opts.wsUrl, {
      transports: ['websocket'],
      query: { tableId, playerId },
    });

    socket.on('disconnect', () => {
      setTimeout(() => socket.connect(), 1000);
    });

    socket.on('connect', () => {
      const action = this.createAction(tableId, playerId);
      const actionId = createHash('sha256')
        .update(JSON.stringify(action))
        .digest('hex');
      const start = performance.now();
      socket.emit('action', action);
      const ackHandler = (ack: { actionId: string }) => {
        const tracker = this.trackers.get(ack.actionId);
        if (tracker) {
          clearTimeout(tracker.timeout);
          tracker.resolve(performance.now() - tracker.start);
          this.trackers.delete(ack.actionId);
        }
      };
      socket.on('action:ack', ackHandler);
      const timeout = setTimeout(() => {
        this.dropped++;
        GameGatewaySoakHarness.droppedCounter.add(1, { tableId });
        socket.off('action:ack', ackHandler);
      }, 1000);
      this.trackers.set(actionId, {
        start,
        resolve: (ms) => this.histogram.record(ms),
        timeout,
      });
    });
  }

  /** Kill the room worker and verify replay from HandLog. */
  private async crashAndReplay(tableId: string) {
    const room = this.roomMgr.get(tableId) as any;
    const before = (await room.getPublicState()) as InternalGameState;
    const primary = room?.primary as any;
    const pid = primary?.worker?.threadId;
    if (pid) {
      try {
        process.kill(pid);
      } catch {
        // ignore if already dead
      }
    }
    await new Promise((r) => setTimeout(r, 100));
    const after = (await room.replay()) as InternalGameState;
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      this.replayFailures++;
      GameGatewaySoakHarness.replayCounter.add(1, { tableId });
      throw new Error(`replay mismatch for ${tableId}`);
    }
  }

  async run() {
    this.setupNetworkImpairment();
    const metricsDir = join(__dirname, '../../../infra/metrics');
    fs.mkdirSync(metricsDir, { recursive: true });
    fs.writeFileSync(this.metricsPath, '');
    this.eld.enable();
    const firstMem = process.memoryUsage();
    const firstElu = performance.eventLoopUtilization(this.lastElu);
    this.lastElu = firstElu;
    this.rssSamples.push(firstMem.rss);
    fs.appendFileSync(
      this.metricsPath,
      JSON.stringify({
        ts: Date.now(),
        heapUsed: firstMem.heapUsed,
        rss: firstMem.rss,
        elu: firstElu.utilization,
      }) + '\n',
    );
    this.startMetricsServer();
    const memInterval = setInterval(() => {
      const mem = process.memoryUsage();
      const elu = performance.eventLoopUtilization(this.lastElu);
      this.lastElu = elu;
      this.rssSamples.push(mem.rss);
      fs.appendFileSync(
        this.metricsPath,
        JSON.stringify({
          ts: Date.now(),
          heapUsed: mem.heapUsed,
          rss: mem.rss,
          elu: elu.utilization,
        }) + '\n',
      );
    }, 1000);
    for (let i = 0; i < this.opts.sockets; i++) {
      this.spawnBot(i);
    }
    const killInterval = setInterval(() => {
      const target = `table-${Math.floor(Math.random() * this.opts.tables)}`;
      void this.crashAndReplay(target).catch(() => {});
    }, 30000);
    await new Promise((r) => setTimeout(r, this.opts.duration * 1000));
    clearInterval(memInterval);
    clearInterval(killInterval);
    const p95 = this.histogram.percentile(95);
    const start = this.rssSamples[0];
    const end = this.rssSamples[this.rssSamples.length - 1];
    const rssDelta = ((end - start) / start) * 100;
    const gcP95 = this.eld.percentile(95) / 1e6;
    this.eld.disable();
    fs.appendFileSync(
      this.metricsPath,
      JSON.stringify({
        ts: Date.now(),
        gc_p95_ms: gcP95,
        rss_delta_pct: rssDelta,
      }) + '\n',
    );
    if (p95 > this.opts.ackP95) {
      throw new Error(`ACK p95 ${p95.toFixed(2)}ms exceeds ${this.opts.ackP95}ms`);
    }
    if (this.dropped > 0) {
      throw new Error(`Detected ${this.dropped} dropped frames`);
    }
    if (this.replayFailures > 0) {
      throw new Error(`Detected ${this.replayFailures} replay failures`);
    }
    if (rssDelta >= 1) {
      throw new Error(`RSS increased by ${rssDelta.toFixed(2)}% \u2265 1%`);
    }
    if (gcP95 > this.opts.gcP95) {
      throw new Error(`GC p95 ${gcP95.toFixed(2)}ms exceeds ${this.opts.gcP95}ms`);
    }
    console.log(
      `ACK p95 ${p95.toFixed(2)}ms, RSS delta ${rssDelta.toFixed(2)}%, GC p95 ${gcP95.toFixed(2)}ms`,
    );
    this.metricsServer?.close();
  }
}

if (require.main === module) {
  const harness = new GameGatewaySoakHarness();
  void harness
    .run()
    .then(() => {
      console.log('Soak harness completed');
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

