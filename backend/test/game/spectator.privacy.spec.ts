import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { GameGateway } from '../../src/game/game.gateway';
import { SpectatorGateway } from '../../src/game/spectator.gateway';
import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hand } from '../../src/database/entities/hand.entity';
import { GameEngine, GameAction } from '../../src/game/engine';
import { MockRedis } from '../utils/mock-redis';
import { GameState } from '../../src/database/entities/game-state.entity';

jest.mock('p-queue', () => ({
  __esModule: true,
  default: class {
    add<T>(fn: () => Promise<T> | T): Promise<T> | T {
      return fn();
    }
    clear() {}
    size = 0;
    pending = 0;
  },
}));

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

class DummyRoom extends EventEmitter {
  private readonly engine = new GameEngine(
    ['p1', 'p2'],
    { startingStack: 100, smallBlind: 1, bigBlind: 2 },
  );

  async apply(_action: GameAction) {
    this.engine.applyAction({
      type: 'postBlind',
      playerId: 'p1',
      amount: 1,
    } as any);
    const state = this.engine.applyAction({
      type: 'postBlind',
      playerId: 'p2',
      amount: 2,
    } as any);
    this.emit('state', this.engine.getState());
    return state;
  }

  async getPublicState() {
    return this.engine.getState();
  }

  async replay() {
    return this.engine.getState();
  }
}

describe('Spectator privacy with GameGateway', () => {
  let app: INestApplication;
  let gameUrl: string;
  let spectateUrl: string;
  let room: DummyRoom;

  beforeAll(async () => {
    room = new DummyRoom();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        SpectatorGateway,
        ClockService,
        { provide: RoomManager, useValue: { get: () => room } },
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
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
    gameUrl = `http://localhost:${address.port}/game`;
    spectateUrl = `http://localhost:${address.port}/spectate`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('omits hole cards from spectator states', async () => {
    const spectator = io(spectateUrl, {
      transports: ['websocket'],
      query: { tableId: 't1' },
    });
    const states: any[] = [];
    spectator.on('state', (s) => states.push(s));

    await waitForConnect(spectator);

    const player = io(gameUrl, {
      transports: ['websocket'],
      auth: { playerId: 'p1' },
    });
    await waitForConnect(player);

    player.emit('action', {
      version: '1',
      type: 'postBlind',
      tableId: 't1',
      playerId: 'p1',
      amount: 1,
      actionId: 'a1',
    });

    await waitFor(() => states.length >= 2, 500);

    spectator.disconnect();
    player.disconnect();

    expect(states.length).toBeGreaterThanOrEqual(2);
    for (const s of states) {
      for (const p of s.players as Array<Record<string, unknown>>) {
        expect(p.holeCards).toBeUndefined();
      }
    }
  });
});

