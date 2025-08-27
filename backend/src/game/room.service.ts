import { EventEmitter } from 'events';
import { GameEngine, GameAction, GameState } from './engine';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';
import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventPublisher } from '../events/events.service';

export class RoomWorker extends EventEmitter {
  private readonly engine: GameEngine;

  constructor(
    private readonly handRepo?: Repository<Hand>,
    private readonly events: EventPublisher,
    playerIds: string[] = ['p1', 'p2'],
  ) {
    super();
    this.engine = new GameEngine(
      playerIds,
      undefined,
      this.handRepo,
      this.events,
    );
  }

  apply(action: GameAction): GameState {
    const state = this.engine.applyAction(action);
    this.emit('state', this.engine.getPublicState());
    return state;
  }

  getPublicState(): GameState {
    return this.engine.getPublicState();
  }

  replay(): GameState {
    return this.engine.replayHand();
  }
}

@Injectable()
export class RoomManager {
  private readonly rooms = new Map<string, RoomWorker>();

  constructor(
    @Optional()
    @InjectRepository(Hand)
    private readonly hands?: Repository<Hand>,
    private readonly events: EventPublisher,
  ) {}

  get(tableId: string): RoomWorker {
    if (!this.rooms.has(tableId)) {
      this.rooms.set(tableId, new RoomWorker(this.hands, this.events));
    }
    return this.rooms.get(tableId)!;
  }
}
