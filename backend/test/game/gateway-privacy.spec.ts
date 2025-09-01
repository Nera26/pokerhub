import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { GameGateway } from '../../src/game/game.gateway';
import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { EventPublisher } from '../../src/events/events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../../src/database/entities/hand.entity';

jest.mock('../../src/game/room.service', () => ({
  RoomManager: class {
    get() {
      return {
        apply: async () => ({
          street: 'preflop',
          pot: 0,
          deck: ['As', 'Kd'],
          players: [
            { id: 'p1', holeCards: ['As', 'Kd'] },
            { id: 'p2', holeCards: ['Qc', 'Jh'] },
          ],
        }),
        getPublicState: async () => ({
          street: 'preflop',
          pot: 0,
          players: [{ id: 'p1' }, { id: 'p2' }],
        }),
        replay: async () => ({ street: 'preflop', pot: 0, players: [] }),
      } as any;
    }
  },
}));

jest.mock('p-queue', () => ({
  __esModule: true,
  default: class {
    add<T>(fn: () => Promise<T> | T): Promise<T> | T {
      return fn();
    }
    clear() {}
  },
}));

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve) => socket.on('connect', () => resolve()));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('GameGateway player privacy', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        RoomManager,
        ClockService,
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
        { provide: EventPublisher, useValue: { emit: jest.fn() } },
        { provide: getRepositoryToken(Hand), useValue: { findOne: jest.fn() } },
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            multi() {
              return {
                incr() {
                  return this;
                },
                exec: async () => [[null, 1], [null, 1]],
              };
            },
            hget: async () => null,
            hset: async () => 'OK',
            incr: async () => 1,
            expire: async () => 1,
            exists: async () => 0,
            set: async () => 'OK',
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((res) => server.listen(0, res));
    const address = server.address();
    url = `http://localhost:${address.port}/game`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('omits deck and hole cards from emitted states', async () => {
    const client = io(url, { transports: ['websocket'] });
    await waitForConnect(client);
    const states: any[] = [];
    client.on('state', (s) => states.push(s));
    client.emit('action', {
      version: '1',
      type: 'next',
      tableId: 'default',
      actionId: 'a1',
    });
    await wait(200);
    client.disconnect();

    expect(states.length).toBeGreaterThan(0);
    for (const s of states) {
      expect(s.deck).toBeUndefined();
      for (const p of s.players as Array<Record<string, unknown>>) {
        expect(p.holeCards).toBeUndefined();
        expect(p.cards).toBeUndefined();
      }
    }
  });
});

