import { EventEmitter } from 'events';
import { GameEngine, GameAction, GameState } from './engine';
import { Repository } from 'typeorm';
import { Hand } from '../database/entities/hand.entity';
import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventPublisher } from '../events/events.service';
import { metrics, trace, SpanStatusCode } from '@opentelemetry/api';

export class RoomWorker extends EventEmitter {
  private readonly engine: GameEngine;
  private static readonly tracer = trace.getTracer('game');
  private static readonly meter = metrics.getMeter('game');
  private static readonly actionCounter = RoomWorker.meter.createCounter(
    'game_actions_total',
    { description: 'Total game actions processed' },
  );
  private static readonly actionDuration = RoomWorker.meter.createHistogram(
    'game_action_duration_ms',
    { description: 'Duration of game actions', unit: 'ms' },
  );

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
    return RoomWorker.tracer.startActiveSpan('game.apply', (span) => {
      const start = Date.now();
      RoomWorker.actionCounter.add(1, { action: action.type });
      try {
        const state = this.engine.applyAction(action);
        this.emit('state', this.engine.getPublicState());
        span.setStatus({ code: SpanStatusCode.OK });
        return state;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw err;
      } finally {
        RoomWorker.actionDuration.record(Date.now() - start, {
          action: action.type,
        });
        span.end();
      }
    });
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
