import { EventEmitter } from 'events';
import { join } from 'path';
import { Worker } from 'worker_threads';
import { Injectable } from '@nestjs/common';
import { GameAction, GameState } from './engine';

interface WorkerMessage {
  seq?: number;
  event?: string;
  state: GameState;
}

export class RoomWorker extends EventEmitter {
  private readonly worker: Worker;
  private seq = 0;
  private readonly pending = new Map<number, (state: GameState) => void>();

  constructor(playerIds: string[] = ['p1', 'p2']) {
    super();
    const workerPath = join(__dirname, 'room.worker.ts');
    this.worker = new Worker(workerPath, {
      workerData: { playerIds },
      execArgv: ['-r', 'ts-node/register'],
    });
    this.worker.on('message', (msg: WorkerMessage) => {
      if (msg.event === 'state') {
        this.emit('state', msg.state);
      }
      if (typeof msg.seq === 'number') {
        const resolve = this.pending.get(msg.seq);
        if (resolve) {
          resolve(msg.state);
          this.pending.delete(msg.seq);
        }
      }
    });
  }

  private call(
    type: 'apply' | 'getState' | 'replay',
    payload: Record<string, unknown> = {},
  ): Promise<GameState> {
    const seq = this.seq++;
    return new Promise<GameState>((resolve) => {
      this.pending.set(seq, resolve);
      this.worker.postMessage({ type, seq, ...payload });
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
}

@Injectable()
export class RoomManager {
  private readonly rooms = new Map<string, RoomWorker>();

  get(tableId: string): RoomWorker {
    if (!this.rooms.has(tableId)) {
      this.rooms.set(tableId, new RoomWorker());
    }
    return this.rooms.get(tableId)!;
  }
}
