import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { WalletService } from '../../src/wallet/wallet.service';
import { SessionService } from '../../src/session/session.service';
import { AuthGuard } from '../../src/auth/auth.guard';
import { AdminGuard } from '../../src/auth/admin.guard';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '../../src/routes/rate-limit.guard';

export async function setupAdminAuth(
  controller: any,
  path: string,
  wallet: Record<string, any>,
): Promise<{
  app: INestApplication;
  server: any;
  expectUnauthenticated: () => Promise<request.Response>;
  expectForbidden: () => Promise<request.Response>;
}> {
  const moduleRef = await Test.createTestingModule({
    controllers: [controller],
    providers: [
      { provide: WalletService, useValue: wallet },
      { provide: SessionService, useValue: { verifyAccessToken: () => 'user1' } },
      { provide: ConfigService, useValue: { get: () => ['secret'] } },
      AuthGuard,
      AdminGuard,
    ],
  })
    .overrideGuard(RateLimitGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  const server = app.getHttpServer();

  const expectUnauthenticated = () => request(server).get(path).expect(401);

  const expectForbidden = () => {
    const token = jwt.sign({ sub: 'user1', role: 'user' }, 'secret');
    return request(server)
      .get(path)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  };

  return { app, server, expectUnauthenticated, expectForbidden };
}

export default setupAdminAuth;
