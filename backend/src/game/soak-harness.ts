import { io, Socket } from 'socket.io-client';
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import { performance, monitorEventLoopDelay } from 'perf_hooks';
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
  private readonly gcMonitor = monitorEventLoopDelay();
  private dropped = 0;
  private replayFailures = 0;
  private readonly memSamples: number[] = [];
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
    this.gcMonitor.enable();
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
    this.memSamples.push(process.memoryUsage().heapUsed);
    const memInterval = setInterval(
      () => this.memSamples.push(process.memoryUsage().heapUsed),
      1000,
    );
    for (let i = 0; i < this.opts.sockets; i++) {
      this.spawnBot(i);
    }
    const restartTarget = 'table-0';
    const killInterval = setInterval(
      () => void this.crashAndReplay(restartTarget).catch(() => {}),
      30000,
    );
    await new Promise((r) => setTimeout(r, this.opts.duration * 1000));
    clearInterval(memInterval);
    clearInterval(killInterval);
    const p95 = this.histogram.percentile(95);
    const start = this.memSamples[0];
    const end = this.memSamples[this.memSamples.length - 1];
    const memDelta = ((end - start) / start) * 100;
    const gcP95 = this.gcMonitor.percentile(95) / 1e6; // ns -> ms
    this.gcMonitor.disable();
    if (p95 > this.opts.ackP95) {
      throw new Error(`ACK p95 ${p95.toFixed(2)}ms exceeds ${this.opts.ackP95}ms`);
    }
    if (this.dropped > 0) {
      throw new Error(`Detected ${this.dropped} dropped frames`);
    }
    if (this.replayFailures > 0) {
      throw new Error(`Detected ${this.replayFailures} replay failures`);
    }
    if (memDelta > 1) {
      throw new Error(`Heap increased by ${memDelta.toFixed(2)}% > 1%`);
    }
    if (gcP95 > this.opts.gcP95) {
      throw new Error(`GC p95 ${gcP95.toFixed(2)}ms exceeds ${this.opts.gcP95}ms`);
    }
    console.log(
      `ACK p95 ${p95.toFixed(2)}ms, heap delta ${memDelta.toFixed(2)}%, GC p95 ${gcP95.toFixed(2)}ms`,
    );
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

