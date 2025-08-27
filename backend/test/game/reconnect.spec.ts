import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { GameGateway } from '../../src/game/game.gateway';
import { GameEngine } from '../../src/game/engine';
import { AnalyticsService } from '../../src/analytics/analytics.service';

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve) => socket.on('connect', () => resolve()));
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('GameGateway reconnect', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        GameGateway,
        GameEngine,
        { provide: AnalyticsService, useValue: { recordGameEvent: jest.fn() } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((res) => server.listen(0, res));
    const address = server.address();
    url = `http://localhost:${(address as any).port}/game`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('ignores duplicate action after reconnect', async () => {
    const action = { type: 'test' };
    const actionId = 'a1';

    const client1 = io(url, { transports: ['websocket'] });
    await waitForConnect(client1);
    client1.emit('action', { ...action, actionId });
    await wait(20);
    client1.disconnect();

    const client2 = io(url, { transports: ['websocket'] });
    const ticks: number[] = [];
    const acks: any[] = [];
    client2.on('state', (s: any) => ticks.push(s.tick));
    client2.on('action:ack', (a) => acks.push(a));
    await waitForConnect(client2);
    client2.emit('action', { ...action, actionId });
    await wait(10);
    client2.emit('action', { ...action, actionId: 'a2' });
    await wait(20);
    client2.disconnect();

    expect(ticks.length).toBe(1);
    expect(acks).toEqual([
      { actionId, duplicate: true },
      { actionId: 'a2' },
    ]);
  });
});
