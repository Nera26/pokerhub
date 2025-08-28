import { EventEmitter } from 'events';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import type { GameAction, GameState } from './engine';

class RoomWorker extends EventEmitter {
  private readonly worker: Worker;
  private seq = 0;
  private readonly pending = new Map<number, (s: unknown) => void>();

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
        const resolver = this.pending.get(seq);
        if (resolver) {
          this.pending.delete(seq);
          resolver((msg.state ?? msg.states) as unknown);
        }
      }
    });
  }

  private call<T = GameState>(
    type: string,
    payload?: Record<string, unknown>,
  ): Promise<T> {
    return new Promise((resolve) => {
      const seq = ++this.seq;
      this.pending.set(seq, resolve);
      this.worker.postMessage({ type, seq, ...(payload ?? {}) });
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

  async terminate(): Promise<void> {
    await this.worker.terminate();
    this.removeAllListeners();
    this.pending.clear();
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
