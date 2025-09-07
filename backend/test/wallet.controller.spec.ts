import { Test } from '@nestjs/testing';
import type { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { WalletController } from '../src/routes/wallet.controller';
import { WalletService } from '../src/wallet/wallet.service';
import { KycService } from '../src/wallet/kyc.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { RateLimitGuard } from '../src/routes/rate-limit.guard';
import { SelfGuard } from '../src/auth/self.guard';

describe('WalletController validation', () => {
  let app: INestApplication;
  const wallet = {
    reserve: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    withdraw: jest.fn(),
    deposit: jest.fn(),
  } as any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: wallet },
        { provide: KycService, useValue: {} },
        SelfGuard,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          const header = req.headers['authorization'];
          if (typeof header === 'string' && header.startsWith('Bearer ')) {
            (req as any).userId = header.slice(7);
            return true;
          }
          return false;
        },
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
    jest.clearAllMocks();
  });

  it('rejects invalid reserve payload', async () => {
    await request(app.getHttpServer())
      .post('/wallet/user1/reserve')
      .set('Authorization', 'Bearer user1')
      .send({ amount: '100' })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(400);
      });
    expect(wallet.reserve).not.toHaveBeenCalled();
  });

  it('rejects invalid commit payload', async () => {
    await request(app.getHttpServer())
      .post('/wallet/user1/commit')
      .set('Authorization', 'Bearer user1')
      .send({ tx: 123 })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(400);
      });
    expect(wallet.commit).not.toHaveBeenCalled();
  });

  it('rejects invalid rollback payload', async () => {
    await request(app.getHttpServer())
      .post('/wallet/user1/rollback')
      .set('Authorization', 'Bearer user1')
      .send({})
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(400);
      });
    expect(wallet.rollback).not.toHaveBeenCalled();
  });

  it('rejects invalid withdraw payload', async () => {
    await request(app.getHttpServer())
      .post('/wallet/user1/withdraw')
      .set('Authorization', 'Bearer user1')
      .send({ amount: -10, deviceId: 123, currency: 'EUR' })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(400);
      });
    expect(wallet.withdraw).not.toHaveBeenCalled();
  });

  it('rejects invalid deposit payload', async () => {
    await request(app.getHttpServer())
      .post('/wallet/user1/deposit')
      .set('Authorization', 'Bearer user1')
      .send({ amount: '10', deviceId: 'd1' })
      .expect((res) => {
        expect(res.status).toBeGreaterThanOrEqual(400);
      });
    expect(wallet.deposit).not.toHaveBeenCalled();
  });
});

