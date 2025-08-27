import { Injectable } from '@nestjs/common';
import { GameEngine, GameAction, GameState } from './engine';
import { WalletService } from '../wallet/wallet.service';

/**
 * RoomWorker represents an isolated table running its own GameEngine.
 * It acts like an actor – events are processed sequentially per room.
 */
export class RoomWorker {
  private readonly engine: GameEngine;

  constructor(
    public readonly id: string,
    playerIds: string[],
    wallet: WalletService,
  ) {
    this.engine = new GameEngine(playerIds, wallet);
  }

  async apply(action: GameAction): Promise<GameState> {
    return this.engine.applyAction(action);
  }

  getState(): GameState {
    return this.engine.getState();
  }
}

/**
 * Manages a pool of room workers. New rooms are lazily created on demand.
 */
@Injectable()
export class RoomManager {
  private readonly rooms = new Map<string, RoomWorker>();

  constructor(private readonly wallet: WalletService) {}

  getRoom(tableId: string, players: string[] = ['p1', 'p2']): RoomWorker {
    let room = this.rooms.get(tableId);
    if (!room) {
      room = new RoomWorker(tableId, players, this.wallet);
      this.rooms.set(tableId, room);
    }
    return room;
  }
}
