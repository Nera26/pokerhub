import { test, expect } from '@playwright/test';
import { Test as NestTest } from '../../backend/node_modules/@nestjs/testing';
import { INestApplication } from '../../backend/node_modules/@nestjs/common';
import { GameGateway } from '../../backend/src/game/game.gateway';
import { RoomManager } from '../../backend/src/game/room.service';
import { ClockService } from '../../backend/src/game/clock.service';
import { AnalyticsService } from '../../backend/src/analytics/analytics.service';
import { EventPublisher } from '../../backend/src/events/events.service';
import { getRepositoryToken } from '../../backend/node_modules/@nestjs/typeorm';
import { Hand } from '../../backend/src/database/entities/hand.entity';

test('replays pending actions after reconnect', async () => {
  const store = new Map<string, string>();
  let pot = 0;
  const room = {
    apply: async (action: any) => {
      if (action.type === 'bet') pot += action.amount ?? 0;
      return { street: 'preflop', pot, players: [] };
    },
    getPublicState: async () => ({ street: 'preflop', pot, players: [] }),
    replay: async () => ({ street: 'preflop', pot, players: [] }),
  };

  const moduleRef = await NestTest.createTestingModule({
    providers: [
      GameGateway,
      { provide: RoomManager, useValue: { get: () => room } },
      ClockService,
      { provide: AnalyticsService, useValue: { recordGameEvent: () => {} } },
      { provide: EventPublisher, useValue: { emit: () => {} } },
      { provide: getRepositoryToken(Hand), useValue: { findOne: () => null } },
      {
        provide: 'REDIS_CLIENT',
        useValue: {
          incr: async () => 1,
          expire: async () => 1,
          exists: async (key: string) => (store.has(key) ? 1 : 0),
          set: async (key: string, value: string, _mode: string, _ttl: number) => {
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
        },
      },
    ],
  }).compile();

  const app: INestApplication = moduleRef.createNestApplication();
  await app.init();
  const server = app.getHttpServer();
  await new Promise<void>((res) => server.listen(0, res));
  const address = server.address() as any;
  process.env.NEXT_PUBLIC_SOCKET_URL = `http://localhost:${address.port}`;

  const {
    getGameSocket,
    sendAction,
    disconnectGameSocket,
  } = await import('../src/lib/socket');

  const s = getGameSocket();
  await new Promise((res) => s.on('connect', res));

  const action = {
    type: 'bet',
    playerId: 'A',
    amount: 5,
    tableId: 'default',
  };

  const promise = sendAction(action);
  s.disconnect();
  s.connect();
  await promise;

  expect(pot).toBe(5);

  disconnectGameSocket();
  await app.close();
});

