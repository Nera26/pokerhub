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
