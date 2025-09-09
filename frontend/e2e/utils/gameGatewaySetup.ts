import { Test as NestTest } from '../../../backend/node_modules/@nestjs/testing';
import type { INestApplication } from '../../../backend/node_modules/@nestjs/common';
import { io, type Socket } from 'socket.io-client';
import { GameGateway } from '../../../backend/src/game/game.gateway';
import { RoomManager } from '../../../backend/src/game/room.service';
import { ClockService } from '../../../backend/src/game/clock.service';
import { AnalyticsService } from '../../../backend/src/analytics/analytics.service';
import { EventPublisher } from '../../../backend/src/events/events.service';
import { getRepositoryToken } from '../../../backend/node_modules/@nestjs/typeorm';
import { Hand } from '../../../backend/src/database/entities/hand.entity';

interface Options {
  /** create a mock room for the gateway */
  room?: Record<string, any>;
  /** mutate the room before use */
  roomHook?: (room: Record<string, any>) => void;
}

export async function gameGatewaySetup({ room, roomHook }: Options = {}) {
  const store = new Map<string, string>();
  const mockRoom = room ?? {
    apply: async () => ({}),
    getPublicState: async () => ({}),
    replay: async () => ({}),
  };
  roomHook?.(mockRoom);

  const moduleRef = await NestTest.createTestingModule({
    providers: [
      GameGateway,
      { provide: RoomManager, useValue: { get: () => mockRoom } },
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
          set: async (
            key: string,
            value: string,
            _mode: string,
            _ttl: number,
          ) => {
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
  const url = `http://localhost:${address.port}`;

  async function connect(): Promise<Socket> {
    const socket = io(`${url}/game`, { transports: ['websocket'] });
    await new Promise((resolve) => socket.on('connect', () => resolve(null)));
    return socket;
  }

  return { app, server, url, connect } as const;
}
