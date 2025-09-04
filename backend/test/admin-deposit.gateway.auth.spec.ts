import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import jwt from 'jsonwebtoken';

import { AdminDepositGateway } from '../src/wallet/admin-deposit.gateway';
import { SessionService } from '../src/session/session.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { ConfigService } from '@nestjs/config';

function waitForConnect(socket: Socket): Promise<void> {
  return new Promise((resolve) => socket.on('connect', () => resolve()));
}

function waitForError(socket: Socket): Promise<void> {
  return new Promise((resolve) => {
    socket.on('connect_error', () => resolve());
    socket.on('disconnect', () => resolve());
  });
}

describe('AdminDepositGateway auth', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminDepositGateway,
        { provide: SessionService, useValue: { verifyAccessToken: () => 'admin1' } },
        { provide: ConfigService, useValue: { get: () => ['secret'] } },
        AuthGuard,
        AdminGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    const server = app.getHttpServer();
    await new Promise<void>((res) => server.listen(0, res));
    const address = server.address();
    url = `http://localhost:${address.port}/admin`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthorized connections', async () => {
    const client = io(url, {
      transports: ['websocket'],
      reconnection: false,
      timeout: 500,
    });
    await new Promise((r) => setTimeout(r, 600));
    expect(client.connected).toBe(false);
    client.disconnect();
  });

  it('allows admin connections with token', async () => {
    const token = jwt.sign({ sub: 'admin1', role: 'admin' }, 'secret');
    const client = io(url, {
      transports: ['websocket'],
      reconnection: false,
      extraHeaders: { Authorization: `Bearer ${token}` },
    });
    await waitForConnect(client);
    expect(client.connected).toBe(true);
    client.disconnect();
  });
});
