import { monitorEventLoopDelay, performance } from 'perf_hooks';
import { createServer } from 'http';
import * as fs from 'fs';
import { join } from 'path';
import { metrics } from '@opentelemetry/api';
import { RoomManager } from './room.service';
import type { InternalGameState } from './engine';
import {
  Histogram,
  setupNetworkImpairment,
  spawnBot,
  AckTracker,
} from './harness-utils';

interface HarnessOptions {
  sockets: number;
  tables: number;
  wsUrl: string;
  packetLoss: number;
  latencyMs: number;
  jitterMs: number;
  ackP95: number;
  duration: number;
  gcP95: number;
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
  private startTime = Date.now();

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
      latencyMs: Number(process.env.LATENCY_MS ?? 0),
      jitterMs: Number(process.env.JITTER_MS ?? 200),
      ackP95: Number(process.env.ACK_P95_MS ?? 120),
      duration: Number(process.env.DURATION_SEC ?? 24 * 60 * 60),
      gcP95: Number(process.env.GC_P95_MS ?? 50),
      ...options,
    };
  }

  /** Configure toxiproxy with loss and latency. */
  setupNetworkImpairment() {
    setupNetworkImpairment({
      packetLoss: this.opts.packetLoss,
      latencyMs: this.opts.latencyMs,
      jitterMs: this.opts.jitterMs,
    });
  }

  private startMetricsServer() {
    const port = Number(process.env.METRICS_PORT ?? 4000);
    this.metricsServer = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      const rss = process.memoryUsage().rss;
      const gcPauseP50 = this.eld.percentile(50) / 1e6;
      const gcPauseP95 = this.eld.percentile(95) / 1e6;
      const gcPauseP99 = this.eld.percentile(99) / 1e6;
      const latencyP50 = this.histogram.percentile(50);
      const latencyP95 = this.histogram.percentile(95);
      const latencyP99 = this.histogram.percentile(99);
      const elapsed = (Date.now() - this.startTime) / 1000;
      const throughput = elapsed > 0 ? this.histogram.count() / elapsed : 0;
      res.end(
        JSON.stringify({
          rssBytes: rss,
          gcPauseP50,
          gcPauseP95,
          gcPauseP99,
          latencyP50,
          latencyP95,
          latencyP99,
          throughput,
        }),
      );
    }).listen(port);
  }


  /** Kill the room worker and verify replay from HandLog. */
  private async crashAndReplay(tableId: string) {
    const room = this.roomMgr.get(tableId) as any;
    let before = (await room.getPublicState()) as InternalGameState;
    // Ensure we're mid-hand; start one if waiting for blinds
    if ((before as any).phase === 'WAIT_BLINDS') {
      await room.apply({ type: 'postBlind', playerId: 'p1', amount: 1 });
      before = (await room.getPublicState()) as InternalGameState;
    }
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
    // Resume play; if table was waiting for big blind, post it
    try {
      await room.apply({ type: 'postBlind', playerId: 'p2', amount: 2 });
    } catch {
      // ignore if action invalid for current phase
    }
  }

  async run() {
    this.setupNetworkImpairment();
    this.startTime = Date.now();
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
      spawnBot({
        id: i,
        tables: this.opts.tables,
        wsUrl: this.opts.wsUrl,
        histogram: this.histogram,
        trackers: this.trackers,
        reconnect: true,
        onDropped: (tableId) => {
          this.dropped++;
          GameGatewaySoakHarness.droppedCounter.add(1, { tableId });
        },
      });
    }
    const crashTable = 'soak-crash-table';
    // Spawn a dedicated table for crash testing
    this.roomMgr.get(crashTable);
    setTimeout(() => {
      void this.crashAndReplay(crashTable).catch(() => {});
    }, 5000);
    await new Promise((r) => setTimeout(r, this.opts.duration * 1000));
    clearInterval(memInterval);
    const p50 = this.histogram.percentile(50);
    const p95 = this.histogram.percentile(95);
    const p99 = this.histogram.percentile(99);
    const throughput = this.histogram.count() / this.opts.duration;
    const start = this.rssSamples[0];
    const end = this.rssSamples[this.rssSamples.length - 1];
    const rssDelta = ((end - start) / start) * 100;
    const gcP50 = this.eld.percentile(50) / 1e6;
    const gcP95 = this.eld.percentile(95) / 1e6;
    const gcP99 = this.eld.percentile(99) / 1e6;
    this.eld.disable();
    fs.appendFileSync(
      this.metricsPath,
      JSON.stringify({
        ts: Date.now(),
        latency_p50_ms: p50,
        latency_p95_ms: p95,
        latency_p99_ms: p99,
        throughput,
        gc_pause_p50_ms: gcP50,
        gc_pause_p95_ms: gcP95,
        gc_pause_p99_ms: gcP99,
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
      `ACK p50 ${p50.toFixed(2)}ms p95 ${p95.toFixed(2)}ms p99 ${p99.toFixed(
        2,
      )}ms, RSS delta ${rssDelta.toFixed(2)}%, GC p95 ${gcP95.toFixed(2)}ms`,
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

