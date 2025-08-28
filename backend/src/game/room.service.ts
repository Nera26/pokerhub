import { EventEmitter } from 'events';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { GameAction, GameState } from './engine';

class RoomWorker extends EventEmitter {
  private state: GameState = { street: 'preflop', pot: 0, players: [] } as any;

  async apply(action: GameAction): Promise<GameState> {
    if (action.type === 'next') {
      if (this.state.street === 'preflop') this.state.street = 'flop';
      else if (this.state.street === 'flop') this.state.street = 'turn';
      else if (this.state.street === 'turn') this.state.street = 'river';
    }
    return this.state;
  }

  async getPublicState(): Promise<GameState> {
    return this.state;
  }

  async replay(): Promise<GameState> {
    return this.state;
  }

  async terminate(): Promise<void> {
    /* no-op */
  }
}

@Injectable()
export class RoomManager implements OnModuleDestroy {
  private readonly rooms = new Map<string, RoomWorker>();

  get(tableId: string): RoomWorker {
    if (!this.rooms.has(tableId)) {
      this.rooms.set(tableId, new RoomWorker());
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

