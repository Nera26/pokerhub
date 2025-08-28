import { EventEmitter } from 'events';
import { Injectable } from '@nestjs/common';
import { GameAction, GameState } from './engine';

class RoomWorker extends EventEmitter {
  private state: GameState = { street: 'preflop', pot: 0, players: [] } as any;

  async apply(_action: GameAction): Promise<GameState> {
    return this.state;
  }

  async getPublicState(): Promise<GameState> {
    return this.state;
  }

  async replay(): Promise<GameState> {
    return this.state;
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
