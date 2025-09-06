import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import AdminWithdrawalsController from '../src/routes/admin-withdrawals.controller';
import { WalletService } from '../src/wallet/wallet.service';
import { SessionService } from '../src/session/session.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';

describe('AdminWithdrawalsController auth', () => {
  let app: INestApplication;
  const wallet = {
    listPendingWithdrawals: jest.fn(),
  } as any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminWithdrawalsController],
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

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    wallet.listPendingWithdrawals.mockClear();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/admin/withdrawals').expect(401);
    expect(wallet.listPendingWithdrawals).not.toHaveBeenCalled();
  });

  it('rejects non-admin requests', async () => {
    const token = jwt.sign({ sub: 'user1', role: 'user' }, 'secret');
    await request(app.getHttpServer())
      .get('/admin/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expect(wallet.listPendingWithdrawals).not.toHaveBeenCalled();
  });
});
