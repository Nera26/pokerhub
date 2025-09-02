import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
jest.mock('../../src/game/room.service', () => ({
  RoomManager: class {
    get() {
      return {
        apply: async () => ({ street: 'preflop', pot: 0, players: [] }),
        getPublicState: async () => ({
          street: 'preflop',
          pot: 0,
          players: [],
        }),
        replay: async () => ({ street: 'preflop', pot: 0, players: [] }),
      } as any;
    }
  },
}));
import { GameGateway } from '../../src/game/game.gateway';
import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { EventPublisher } from '../../src/events/events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../../src/database/entities/hand.entity';
import { MockRedis } from '../utils/mock-redis';
import { GameState } from '../../src/database/entities/game-state.entity';

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve) => socket.on('connect', () => resolve()));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(cond: () => boolean, timeout = 200) {
  const start = Date.now();
  while (!cond() && Date.now() - start < timeout) {
    await wait(10);
  }
}

describe('GameGateway reconnect', () => {
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
        { provide: getRepositoryToken(GameState), useValue: { find: jest.fn(), save: jest.fn() } },
        { provide: 'REDIS_CLIENT', useClass: MockRedis },
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

  it('ignores duplicate action after reconnect', async () => {
    const action = { type: 'next', tableId: 'default', version: '1' };
    const actionId = 'a1';

    const client1 = io(url, { transports: ['websocket'] });
    await waitForConnect(client1);
    client1.emit('action', { ...action, actionId });
    await wait(100);
    client1.disconnect();

    const client2 = io(url, { transports: ['websocket'] });
    const acks: any[] = [];
    client2.on('action:ack', (a) => acks.push(a));
    await waitForConnect(client2);
    client2.emit('action', { ...action, actionId });
    client2.emit('action', { ...action, actionId: 'a2' });
    await waitFor(() => acks.length >= 1, 500);
    client2.disconnect();

    expect(acks[0]).toEqual({ actionId, duplicate: true });
  });
});
