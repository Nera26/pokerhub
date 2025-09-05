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
  jitterMs: number;
  ackP95: number;
  duration: number;
}

class GameGatewayLoadHarness {
  private readonly opts: HarnessOptions;
  private readonly histogram = new Histogram();
  private readonly trackers = new Map<string, AckTracker>();
  private dropped = 0;
  private memStart = 0;
  private roomMgr = new RoomManager();
  private replayFailures = 0;

  constructor(options?: Partial<HarnessOptions>) {
    this.opts = {
      sockets: Number(process.env.SOCKETS ?? 10000),
      tables: Number(process.env.TABLES ?? 10000),
      wsUrl: process.env.WS_URL ?? 'ws://localhost:3001/game',
      packetLoss: Number(process.env.PACKET_LOSS ?? 0.05),
      jitterMs: Number(process.env.JITTER_MS ?? 200),
      ackP95: Number(process.env.ACK_P95_MS ?? 120),
      duration: Number(process.env.DURATION_SEC ?? 60),
      ...options,
    };
  }

  /** Configure toxiproxy with loss and latency. */
  setupNetworkImpairment() {
    setupNetworkImpairment({
      packetLoss: this.opts.packetLoss,
      latencyMs: this.opts.jitterMs,
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
        // worker may already be dead
      }
    }
    await new Promise((r) => setTimeout(r, 100));
    const after = (await room.replay()) as InternalGameState;
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      this.replayFailures++;
      throw new Error(`replay mismatch for ${tableId}`);
    }
  }

  private recordMemory() {
    const usage = process.memoryUsage().heapUsed;
    if (!this.memStart) this.memStart = usage;
    const delta = ((usage - this.memStart) / this.memStart) * 100;
    return { usage, delta };
  }

  async run() {
    this.setupNetworkImpairment();
    this.memStart = process.memoryUsage().heapUsed;
    for (let i = 0; i < this.opts.sockets; i++) {
      spawnBot({
        id: i,
        tables: this.opts.tables,
        wsUrl: this.opts.wsUrl,
        histogram: this.histogram,
        trackers: this.trackers,
        onDropped: () => this.dropped++,
      });
    }
    const killInterval = setInterval(() => {
      const target = `table-${Math.floor(Math.random() * this.opts.tables)}`;
      void this.crashAndReplay(target).catch(() => {});
    }, 5000);
    await new Promise((r) => setTimeout(r, this.opts.duration * 1000));
    clearInterval(killInterval);
    const p95 = this.histogram.percentile(95);
    const mem = this.recordMemory();
    if (p95 > this.opts.ackP95) {
      throw new Error(`ACK p95 ${p95.toFixed(2)}ms exceeds ${this.opts.ackP95}ms`);
    }
    if (this.dropped > 0) {
      throw new Error(`Detected ${this.dropped} dropped frames`);
    }
    if (this.replayFailures > 0) {
      throw new Error(`Detected ${this.replayFailures} replay failures`);
    }
    if (mem.delta > 1) {
      throw new Error(`Heap increased by ${mem.delta.toFixed(2)}% > 1%`);
    }
    console.log(`ACK p95 ${p95.toFixed(2)}ms, heap delta ${mem.delta.toFixed(2)}%`);
  }
}

if (require.main === module) {
  const harness = new GameGatewayLoadHarness();
  void harness
    .run()
    .then(() => {
      console.log('Load harness completed');
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
