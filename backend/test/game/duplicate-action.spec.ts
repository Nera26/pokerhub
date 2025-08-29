import { Test } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { GameGateway } from '../../src/game/game.gateway';
import { ClockService } from '../../src/game/clock.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { EventPublisher } from '../../src/events/events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../../src/database/entities/hand.entity';
import { RoomManager } from '../../src/game/room.service';

class MockSocket extends EventEmitter {
  id = Math.random().toString(36).slice(2);
  emitted: Record<string, any[]> = {};
  emit(event: string, payload: any) {
    if (!this.emitted[event]) this.emitted[event] = [];
    this.emitted[event].push(payload);
    return super.emit(event, payload);
  }
  handshake = { auth: {} } as any;
}

describe('GameGateway duplicate actions', () => {
  let gateway: GameGateway;
  let applyMock: jest.Mock;

  beforeAll(async () => {
    const room = {
      apply: (applyMock = jest.fn(async () => ({
        street: 'preflop',
        pot: 5,
        players: [],
      }))),
      getPublicState: async () => ({ street: 'preflop', pot: 5, players: [] }),
      replay: async () => ({ street: 'preflop', pot: 5, players: [] }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        ClockService,
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
        { provide: EventPublisher, useValue: { emit: jest.fn() } },
        { provide: getRepositoryToken(Hand), useValue: { findOne: jest.fn() } },
        { provide: RoomManager, useValue: { get: () => room } },
        {
          provide: 'REDIS_CLIENT',
          useValue: (() => {
            const store = new Map<string, string>();
            return {
              incr: async () => 1,
              expire: async () => 1,
              exists: async (key: string) => (store.has(key) ? 1 : 0),
              set: async (key: string, value: string) => {
                store.set(key, value);
                return 'OK';
              },
              hget: async (_key: string, field: string) => store.get(field),
              hset: async (_key: string, field: string, value: string) => {
                store.set(field, value);
                return 1;
              },
              multi: () => {
                const results: [null, number][] = [];
                const chain = {
                  incr: (_k: string) => {
                    results.push([null, results.length + 1]);
                    return chain;
                  },
                  exec: async () => results,
                };
                return chain;
              },
            };
          })(),
        },
      ],
    }).compile();

    gateway = moduleRef.get(GameGateway);
  });

  it('only processes the first action and acknowledges duplicates', async () => {
    const socket = new MockSocket();

    await gateway.handleAction(socket as any, {
      type: 'next',
      tableId: 'default',
      version: '1',
      actionId: 'a1',
    });

    expect(applyMock).toHaveBeenCalledTimes(1);
    expect(socket.emitted['state']).toHaveLength(1);
    expect(socket.emitted['action:ack'][0]).toEqual({ actionId: 'a1' });
    const state = socket.emitted['state'][0];
    expect(state.tick).toBe(1);
    expect(state.pot).toBe(5);

    await gateway.handleAction(socket as any, {
      type: 'next',
      tableId: 'default',
      version: '1',
      actionId: 'a1',
    });

    expect(applyMock).toHaveBeenCalledTimes(1);
    expect(socket.emitted['state']).toHaveLength(1);
    expect(socket.emitted['action:ack'][1]).toEqual({ actionId: 'a1', duplicate: true });
  });
});

