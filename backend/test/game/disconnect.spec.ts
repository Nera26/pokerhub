import { Test } from '@nestjs/testing';
import { GameGateway } from '../../src/game/game.gateway';
import { ClockService } from '../../src/game/clock.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { EventPublisher } from '../../src/events/events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../../src/database/entities/hand.entity';
import { RoomManager } from '../../src/game/room.service';
import { EventEmitter } from 'events';

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

describe('GameGateway disconnect dedupe', () => {
  let gateway: GameGateway;
  let applyMock: jest.Mock;
  const handLog: string[] = [];
  let pot = 0;

  beforeAll(async () => {
    const room = {
      apply: (applyMock = jest.fn(async () => {
        if (handLog.length === 0) {
          pot = 5;
          handLog.push('next');
        } else {
          handLog.push('settle');
        }
        return { street: 'preflop', pot, players: [] };
      })),
      getPublicState: async () => ({ street: 'preflop', pot, players: [] }),
      replay: async () => ({ street: 'preflop', pot, players: [] }),
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

  it('deduplicates actionId and resumes tick', async () => {
    const s1 = new MockSocket();
    await gateway.handleAction(s1 as any, {
      type: 'next',
      tableId: 'default',
      version: '1',
      actionId: 'a1',
    });
    const firstState = s1.emitted['state'][0];
    expect(firstState.tick).toBe(1);

    const s2 = new MockSocket();
    await gateway.handleAction(s2 as any, {
      type: 'next',
      tableId: 'default',
      version: '1',
      actionId: 'a1',
    });
    await gateway.handleAction(s2 as any, {
      type: 'next',
      tableId: 'default',
      version: '1',
      actionId: 'a2',
    });
    const ack1 = s2.emitted['action:ack'][0];
    const state2 = s2.emitted['state'][0];

    expect(ack1).toEqual({ actionId: 'a1', duplicate: true });
    expect(state2.tick).toBe(2);
    expect(state2.pot).toBe(5);
    expect(handLog).toEqual(['next', 'settle']);
    expect(applyMock).toHaveBeenCalledTimes(2);
  });
});
