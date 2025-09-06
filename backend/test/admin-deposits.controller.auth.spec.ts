import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import AdminDepositsController from '../src/routes/admin-deposits.controller';
import { WalletService } from '../src/wallet/wallet.service';
import { SessionService } from '../src/session/session.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { ConfigService } from '@nestjs/config';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';

describe('AdminDepositsController auth', () => {
  let app: INestApplication;
  const wallet = {
    listPendingDeposits: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminDepositsController],
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
    wallet.listPendingDeposits.mockClear();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/admin/deposits').expect(401);
    expect(wallet.listPendingDeposits).not.toHaveBeenCalled();
  });

  it('rejects non-admin requests', async () => {
    const token = jwt.sign({ sub: 'user1', role: 'user' }, 'secret');
    await request(app.getHttpServer())
      .get('/admin/deposits')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expect(wallet.listPendingDeposits).not.toHaveBeenCalled();
  });
});
