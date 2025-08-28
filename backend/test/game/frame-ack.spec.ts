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

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve) => socket.on('connect', () => resolve()));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('GameGateway frame ack', () => {
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

  it('stops retrying after ACK', async () => {
    const client = io(url, { transports: ['websocket'] });
    await waitForConnect(client);
    const states: any[] = [];
    client.on('state', (s) => {
      states.push(s);
      if (states.length === 1) {
        client.emit('frame:ack', { frameId: s.frameId });
      }
    });
    client.emit('action', { type: 'next', tableId: 'default', actionId: 'a1' });
    await wait(500);
    client.disconnect();
    expect(states.length).toBe(1);
    expect(states[0]).toHaveProperty('frameId');
  });

  it('retries until ACK received', async () => {
    const client = io(url, { transports: ['websocket'] });
    await waitForConnect(client);
    const states: any[] = [];
    client.on('state', (s) => states.push(s));
    client.emit('action', { type: 'next', tableId: 'default', actionId: 'a2' });
    await wait(500);
    client.disconnect();
    expect(states.length).toBeGreaterThan(1);
  });
});

