import { io, Socket } from 'socket.io-client';
import { createHash } from 'crypto';
import { spawnSync } from 'child_process';
import { performance } from 'perf_hooks';
import { RoomManager } from './room.service';
import type { GameAction } from '@shared/types';

interface HarnessOptions {
  sockets: number;
  tables: number;
  wsUrl: string;
  packetLoss: number;
  jitterMs: number;
  ackP95: number;
  duration: number;
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

export class GameGatewayLoadHarness {
  private readonly opts: HarnessOptions;
  private readonly histogram = new Histogram();
  private readonly trackers = new Map<string, AckTracker>();
  private dropped = 0;
  private memStart = 0;
  private roomMgr = new RoomManager();

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
        socket.off('action:ack', ackHandler);
      }, 1000);
      this.trackers.set(actionId, {
        start,
        resolve: (ms) => this.histogram.record(ms),
        timeout,
      });
    });
  }

  /** Restart a room worker and verify replay from HandLog. */
  private async restartWorker(tableId: string) {
    await this.roomMgr.close(tableId);
    const room = this.roomMgr.get(tableId);
    const state = await room.replay();
    if (!state) {
      throw new Error(`replay failed for ${tableId}`);
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
      this.spawnBot(i);
    }
    const restartTarget = 'table-0';
    setTimeout(() => void this.restartWorker(restartTarget), 5000);
    await new Promise((r) => setTimeout(r, this.opts.duration * 1000));
    const p95 = this.histogram.percentile(95);
    const mem = this.recordMemory();
    if (p95 > this.opts.ackP95) {
      throw new Error(`ACK p95 ${p95.toFixed(2)}ms exceeds ${this.opts.ackP95}ms`);
    }
    if (this.dropped > 0) {
      throw new Error(`Detected ${this.dropped} dropped frames`);
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
