import { EventEmitter } from 'events';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import type { GameAction, GameState } from './engine';

class WorkerHost extends EventEmitter {
  private readonly worker: Worker;
  private seq = 0;
  private readonly pending = new Map<number, [(s: unknown) => void, (e: unknown) => void]>();

  constructor(private readonly tableId: string, playerIds?: string[]) {
    super();
    this.worker = new Worker(resolve(__dirname, './room.worker.ts'), {
      workerData: { tableId, playerIds },
      execArgv: ['-r', 'ts-node/register'],
    });
    this.worker.on('message', (msg: any) => {
      if (msg.event === 'state') {
        this.emit('state', msg.state as GameState);
        return;
      }
      const seq = msg.seq as number;
      if (typeof seq === 'number') {
        const handlers = this.pending.get(seq);
        if (handlers) {
          this.pending.delete(seq);
          handlers[0]((msg.state ?? msg.states ?? msg.ok) as unknown);
        }
      }
    });
    this.worker.on('exit', () => {
      for (const [, [, reject]] of this.pending) {
        reject(new Error('worker exited'));
      }
      this.pending.clear();
    });
  }

  private call<T = GameState>(
    type: string,
    payload?: Record<string, unknown>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const seq = ++this.seq;
      this.pending.set(seq, [resolve, reject]);
      try {
        this.worker.postMessage({ type, seq, ...(payload ?? {}) });
      } catch (err) {
        this.pending.delete(seq);
        reject(err);
      }
    });
  }

  apply(action: GameAction): Promise<GameState> {
    return this.call('apply', { action });
  }

  getPublicState(): Promise<GameState> {
    return this.call('getState');
  }

  replay(): Promise<GameState> {
    return this.call('replay');
  }

  resume(from: number): Promise<Array<[number, GameState]>> {
    return this.call('resume', { from });
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
  private primary: WorkerHost;
  private follower?: WorkerHost;
  private heartbeat?: NodeJS.Timer;
  private lastConfirmed = 0;

  constructor(private readonly tableId: string, playerIds?: string[]) {
    super();
    this.primary = new WorkerHost(tableId, playerIds);
    this.follower = new WorkerHost(tableId, playerIds);
    this.primary.on('state', (s) => this.emit('state', s));
    this.startHeartbeat();
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
      // ignore
    }
    this.primary = follower;
    this.primary.on('state', (s) => this.emit('state', s));
  }

  async apply(action: GameAction): Promise<GameState> {
    const state = await this.primary.apply(action);
    if (this.follower) {
      await this.follower.apply(action);
      this.lastConfirmed++;
    }
    return state;
  }

  getPublicState(): Promise<GameState> {
    return this.primary.getPublicState();
  }

  async replay(): Promise<GameState> {
    const state = await this.primary.replay();
    if (this.follower) {
      await this.follower.replay();
    }
    return state;
  }

  resume(from: number): Promise<Array<[number, GameState]>> {
    return this.primary.resume(from);
  }

  async terminate(): Promise<void> {
    if (this.heartbeat) clearInterval(this.heartbeat);
    await this.primary.terminate();
    if (this.follower) await this.follower.terminate();
    this.removeAllListeners();
  }
}

@Injectable()
export class RoomManager implements OnModuleDestroy {
  private readonly rooms = new Map<string, RoomWorker>();

  get(tableId: string): RoomWorker {
    if (!this.rooms.has(tableId)) {
      this.rooms.set(tableId, new RoomWorker(tableId));
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

