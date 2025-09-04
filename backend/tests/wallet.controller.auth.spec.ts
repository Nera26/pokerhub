import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { WalletController } from '../src/routes/wallet.controller';
import { WalletService } from '../src/wallet/wallet.service';
import { KycService } from '../src/wallet/kyc.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { SessionService } from '../src/session/session.service';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';
import { SelfGuard } from '../src/auth/self.guard';

describe('WalletController auth', () => {
  let app: INestApplication;
  const wallet = { status: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: wallet },
        { provide: KycService, useValue: {} },
        { provide: SessionService, useValue: { verifyAccessToken: () => 'user1' } },
        AuthGuard,
        SelfGuard,
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
    wallet.status.mockClear();
  });

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/wallet/user1/status').expect(401);
    expect(wallet.status).not.toHaveBeenCalled();
  });

  it('rejects mismatched user id', async () => {
    await request(app.getHttpServer())
      .get('/wallet/user2/status')
      .set('Authorization', 'Bearer token')
      .expect(403);
    expect(wallet.status).not.toHaveBeenCalled();
  });
});
