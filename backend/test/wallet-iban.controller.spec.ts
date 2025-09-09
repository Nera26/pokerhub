import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { WalletIbanController } from '../src/routes/wallet-iban.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { SessionService } from '../src/session/session.service';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';
import { WalletService } from '../src/wallet/wallet.service';

describe('WalletIbanController', () => {
  let app: INestApplication;
  const wallet: Partial<WalletService> = {
    getDepositIban: jest.fn().mockResolvedValue({
      iban: 'DE00',
      masked: 'DE**',
      holder: 'h',
      instructions: 'i',
      updatedBy: 'u',
      updatedAt: new Date().toISOString(),
    }),
    getIbanHistory: jest.fn().mockResolvedValue({ history: [] }),
    updateDepositIban: jest
      .fn()
      .mockResolvedValue({
        iban: 'DE00',
        masked: 'DE**',
        holder: 'h',
        instructions: 'i',
        updatedBy: 'u',
        updatedAt: new Date().toISOString(),
      }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WalletIbanController],
      providers: [
        { provide: SessionService, useValue: { verifyAccessToken: () => 'user1' } },
        AuthGuard,
        { provide: WalletService, useValue: wallet },
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

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/wallet/iban').expect(401);
  });

  it('returns iban data when authenticated', async () => {
    await request(app.getHttpServer())
      .get('/wallet/iban')
      .set('Authorization', 'Bearer token')
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('iban');
        expect(res.body).toHaveProperty('masked');
        expect(res.body).toHaveProperty('updatedBy');
        expect(res.body).toHaveProperty('updatedAt');
      });
  });

  it('returns history array when authenticated', async () => {
    await request(app.getHttpServer())
      .get('/wallet/iban/history')
      .set('Authorization', 'Bearer token')
      .expect(200)
      .expect(res => {
        expect(Array.isArray(res.body.history)).toBe(true);
      });
    expect(wallet.getIbanHistory).toHaveBeenCalled();
  });

  it('updates iban when posting', async () => {
    await request(app.getHttpServer())
      .post('/wallet/iban')
      .set('Authorization', 'Bearer token')
      .send({ iban: 'DE00', holder: 'h', instructions: 'i' })
      .expect(200);
    expect(wallet.updateDepositIban).toHaveBeenCalledWith(
      { iban: 'DE00', holder: 'h', instructions: 'i' },
      'user1',
    );
  });
});
