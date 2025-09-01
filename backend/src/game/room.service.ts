import { EventEmitter } from 'events';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import { metrics, type ObservableResult } from '@opentelemetry/api';
import type { GameAction, InternalGameState } from './engine';
import type Redis from 'ioredis';

class WorkerHost extends EventEmitter {
  private readonly worker: Worker;
  private seq = 0;
  private readonly pending = new Map<
    number,
    [(s: unknown) => void, (e: unknown) => void]
  >();

  constructor(
    private readonly tableId: string,
    file: string,
    playerIds?: string[],
    extraData: Record<string, unknown> = {},
  ) {
    super();
    this.worker = new Worker(resolve(__dirname, file), {
      workerData: { tableId, playerIds, ...extraData },
      execArgv: ['-r', 'ts-node/register'],
    });

    this.worker.on('message', (msg: any) => {
      if (msg?.event === 'state') {
        this.emit('state', msg.state as InternalGameState);
        return;
      }
      const seq = msg?.seq as number | undefined;
      if (typeof seq === 'number') {
        const handlers = this.pending.get(seq);
        if (handlers) {
          this.pending.delete(seq);
          handlers[0]((msg.state ?? msg.states ?? msg.ok) as unknown);
        }
      }
    });

    this.worker.on('error', (err) => {
      const error = new Error(
        `worker error: ${(err as Error)?.message ?? String(err)}`,
      );
      for (const [, [, reject]] of this.pending) {
        reject(error);
      }
      this.pending.clear();
      this.emit('error', err);
    });

    this.worker.on('exit', (code) => {
      for (const [, [, reject]] of this.pending) {
        reject(new Error('worker exited'));
      }
      this.pending.clear();
      this.emit('exit', code);
    });
  }

  private call<T = InternalGameState>(
    type: string,
    payload?: Record<string, unknown>,
  ): Promise<T> {
    return new Promise((resolvePromise, rejectPromise) => {
      const seq = ++this.seq;
      this.pending.set(seq, [resolvePromise, rejectPromise]);
      try {
        this.worker.postMessage({ type, seq, ...(payload ?? {}) });
      } catch (err) {
        this.pending.delete(seq);
        rejectPromise(err);
      }
    });
  }

  apply(action: GameAction): Promise<InternalGameState> {
    return this.call('apply', { action });
  }

  getPublicState(): Promise<InternalGameState> {
    return this.call('getState');
  }

  replay(): Promise<InternalGameState> {
    return this.call('replay');
  }

  resume(from: number): Promise<Array<[number, InternalGameState]>> {
    return this.call('resume', { from });
  }

  snapshot(states: Array<[number, InternalGameState]>): Promise<void> {
    return this.call('snapshot', { states });
  }

  ping(): Promise<void> {
    return this.call('ping');
  }

  async terminate(): Promise<void> {
    await this.worker.terminate();
    this.removeAllListeners();
    this.pending.clear();
  }
}

class RoomWorker extends EventEmitter {
  private static readonly meter = metrics.getMeter('game');

  // Observable gauge: follower lag (applied - confirmed)
  private static readonly followerLag =
    RoomWorker.meter.createObservableGauge?.('room_follower_lag', {
      description: 'Number of actions the follower is behind the primary',
      unit: 'actions',
    }) ??
    ({
      addCallback() {},
      removeCallback() {},
    } as {
      addCallback(cb: (r: ObservableResult) => void): void;
      removeCallback(cb: (r: ObservableResult) => void): void;
    });

  // Up/Down counter: in-flight actions awaiting follower confirmation
  private static readonly actionLag =
    RoomWorker.meter.createUpDownCounter?.('game_action_lag', {
      description:
        'Number of actions applied but not yet confirmed by follower',
    }) ??
    ({
      add() {},
    } as { add(n: number, attrs?: Record<string, unknown>): void });

  private primary: WorkerHost;
  private follower?: WorkerHost;
  private heartbeat?: NodeJS.Timeout;
  private lastConfirmed = 0;
  private applied = 0;

  private readonly observeLag = (result: ObservableResult) => {
    result.observe(this.applied - this.lastConfirmed, {
      tableId: this.tableId,
    } as any);
  };

  constructor(
    private readonly tableId: string,
    redis?: Redis,
    playerIds?: string[],
  ) {
    super();
    const extra = redis ? { redisOptions: redis.options } : {};
    this.primary = new WorkerHost(tableId, './room.worker.ts', playerIds, extra);
    this.follower = new WorkerHost(tableId, './room.follower.ts', playerIds, extra);
    this.primary.on('state', (s) => this.emit('state', s));
    this.primary.on('exit', () => void this.promoteFollower());
    RoomWorker.followerLag.addCallback(this.observeLag);
    void this.syncFollower();
    this.startHeartbeat();
  }

  private async syncFollower() {
    if (!this.follower) return;
    const states = await this.primary.resume(0);
    await this.follower.snapshot(states);
    this.lastConfirmed = states.length;
  }

  private startHeartbeat() {
    this.heartbeat = setInterval(async () => {
      try {
        await this.primary.ping();
      } catch {
        await this.promoteFollower();
      }
    }, 100);
  }

  private async promoteFollower() {
    const follower = this.follower;
    if (!follower) return;

    this.follower = undefined;

    try {
      await this.primary.terminate();
    } catch {
      // ignore termination errors
    }

    this.primary = follower;
    this.primary.on('state', (s) => this.emit('state', s));

    // keep lag consistent across promotion
    this.lastConfirmed = this.applied;
    this.emit('failover', this.tableId);
  }

  async apply(action: GameAction): Promise<InternalGameState> {
    const state = await this.primary.apply(action);
    this.applied++;
    this.lastConfirmed = this.applied;
    return state;
  }

  getPublicState(): Promise<InternalGameState> {
    return this.primary.getPublicState();
  }

  async replay(): Promise<InternalGameState> {
    const state = await this.primary.replay();
    if (this.follower) {
      await this.follower.replay();
    }
    return state;
  }

  resume(from: number): Promise<Array<[number, InternalGameState]>> {
    return this.primary.resume(from);
  }

  async terminate(): Promise<void> {
    if (this.heartbeat) clearInterval(this.heartbeat);
    await this.primary.terminate();
    if (this.follower) await this.follower.terminate();
    RoomWorker.followerLag.removeCallback(this.observeLag);
    this.removeAllListeners();
  }
}

@Injectable()
export class RoomManager implements OnModuleDestroy {
  private readonly rooms = new Map<string, RoomWorker>();

  constructor(
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
  ) {}

  get(tableId: string): RoomWorker {
    if (!this.rooms.has(tableId)) {
      this.rooms.set(tableId, new RoomWorker(tableId, this.redis));
    }
    return this.rooms.get(tableId)!;
  }

  async close(tableId: string): Promise<void> {
    const worker = this.rooms.get(tableId);
    if (worker) {
      this.rooms.delete(tableId);
      await worker.terminate();
    }
  }

  async onModuleDestroy() {
    await Promise.all([...this.rooms.values()].map((w) => w.terminate()));
    this.rooms.clear();
  }
}
