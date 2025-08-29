import { test, expect } from '@playwright/test';
import { Test as NestTest } from '../../backend/node_modules/@nestjs/testing';
import { INestApplication } from '../../backend/node_modules/@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { GameGateway } from '../../backend/src/game/game.gateway';
import { RoomManager } from '../../backend/src/game/room.service';
import { ClockService } from '../../backend/src/game/clock.service';
import { AnalyticsService } from '../../backend/src/analytics/analytics.service';
import { EventPublisher } from '../../backend/src/events/events.service';
import { getRepositoryToken } from '../../backend/node_modules/@nestjs/typeorm';
import { Hand } from '../../backend/src/database/entities/hand.entity';

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve) => socket.on('connect', () => resolve()));
}

async function waitFor(cond: () => boolean, timeout = 500) {
  const start = Date.now();
  while (!cond() && Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, 10));
  }
}

test('deduplicates action and resumes tick after reconnect', async () => {
  const store = new Map<string, string>();
  const handLog: string[] = [];
  let pot = 0;
  let settled = false;
  const room = {
    apply: async (action: any) => {
      if (action.type === 'bet') pot += action.amount ?? 0;
      if (action.type === 'next' && !settled) {
        handLog.push('settle');
        settled = true;
      } else {
        handLog.push(action.type);
      }
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
  const url = `http://localhost:${address.port}/game`;

  const bet = { type: 'bet', playerId: 'A', amount: 5, tableId: 'default', version: '1' };
  const next = { type: 'next', tableId: 'default', version: '1' };

  const client1 = io(url, { transports: ['websocket'] });
  const states1: any[] = [];
  client1.on('state', (s) => states1.push(s));
  await waitForConnect(client1);
  client1.emit('action', { ...bet, actionId: 'a1' });
  await waitFor(() => states1.length >= 1);
  client1.disconnect();

  const client2 = io(url, { transports: ['websocket'] });
  const states2: any[] = [];
  const acks: any[] = [];
  client2.on('state', (s) => states2.push(s));
  client2.on('action:ack', (a) => acks.push(a));
  await waitForConnect(client2);
  client2.emit('action', { ...bet, actionId: 'a1' });
  client2.emit('action', { ...next, actionId: 'a2' });
  await waitFor(() => acks.length >= 2 && states2.length >= 1);
  client2.disconnect();

  expect(acks[0]).toEqual({ actionId: 'a1', duplicate: true });
  expect(states1[0].tick).toBe(1);
  expect(states2[0].tick).toBe(2);
  expect(states2[0].pot).toBe(5);
  expect(handLog).toEqual(['bet', 'settle']);

  await app.close();
});
