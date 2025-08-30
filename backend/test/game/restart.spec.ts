import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { GameGateway } from '../../src/game/game.gateway';
import { RoomManager } from '../../src/game/room.service';
import { ClockService } from '../../src/game/clock.service';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { EventPublisher } from '../../src/events/events.service';

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

class FakeRedis {
  private store = new Map<string, number | string>();
  private hashes = new Map<string, Map<string, string>>();

  async incr(key: string) {
    const current = Number(this.store.get(key) ?? 0);
    const next = current + 1;
    this.store.set(key, next);
    return next;
  }

  async expire() {
    return 1;
  }

  async exists(key: string) {
    return this.store.has(key) ? 1 : 0;
  }

  async set(key: string, value: string, _mode: string, _ttl: number) {
    this.store.set(key, value);
    return 'OK';
  }

  async hget(key: string, field: string) {
    return this.hashes.get(key)?.get(field) ?? null;
  }

  async hset(key: string, field: string, value: string) {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    this.hashes.get(key)!.set(field, value);
    return 1;
  }

  multi() {
    const keys: string[] = [];
    const self = this;
    return {
      incr(key: string) {
        keys.push(key);
        return this;
      },
      async exec() {
        return Promise.all(keys.map(async (k) => [null, await self.incr(k)]));
      },
    };
  }
}

describe('GameGateway restart', () => {
  let redis: FakeRedis;

  jest.setTimeout(15000);

  async function createApp() {
    const room = {
      apply: jest.fn().mockResolvedValue({}),
      getPublicState: jest.fn().mockResolvedValue({}),
    };
    const roomManager = { get: () => room };
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        { provide: RoomManager, useValue: roomManager },
        ClockService,
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
        { provide: EventPublisher, useValue: { emit: jest.fn() } },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((res) => server.listen(0, res));
    const address = server.address();
    return { app, url: `http://localhost:${address.port}/game` };
  }

  it('ignores duplicate action after server restart', async () => {
    redis = new FakeRedis();
    const { app, url } = await createApp();
    const action = {
      type: 'postBlind',
      tableId: 't_restart',
      version: '1',
      playerId: 'p1',
      amount: 1,
    } as const;
    const actionId = 'a1';
    const client1 = io(url, { transports: ['websocket'] });
    await waitForConnect(client1);
    client1.emit('action', { ...action, actionId });
    await wait(100);
    client1.disconnect();
    await app.close();

    const { app: app2, url: url2 } = await createApp();
    const client2 = io(url2, { transports: ['websocket'] });
    const acks: any[] = [];
    client2.on('action:ack', (a) => acks.push(a));
    await waitForConnect(client2);
    client2.emit('action', { ...action, actionId });
    client2.emit('action', { ...action, actionId: 'a2' });
    await waitFor(() => acks.length >= 2, 5000);
    client2.disconnect();
    await app2.close();

    expect(acks.find((a) => a.actionId === actionId)).toMatchObject({
      actionId,
      duplicate: true,
    });
  });
});
