import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import type { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';

import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { KycService } from '../../src/wallet/kyc.service';
import { WalletController } from '../../src/routes/wallet.controller';
import AdminDepositsController from '../../src/routes/admin-deposits.controller';
import { AuthGuard } from '../../src/auth/auth.guard';
import { RateLimitGuard } from '../../src/routes/rate-limit.guard';
import { SelfGuard } from '../../src/auth/self.guard';
import { AdminGuard } from '../../src/auth/admin.guard';
import { createInMemoryDb, createWalletServices, completeBankTransferDepositWorkflow } from './test-utils';
// Coupled with pending-deposit.worker.ts; keep this test in sync with worker logic.

/**
 * Integration test of bank transfer deposit via WalletController:
 * player initiates deposit, background worker flags it, admin confirms, and balance updates.
 */
describe('WalletController bank transfer workflow', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: WalletService;
  let events: EventPublisher;
  let repos: ReturnType<typeof createWalletServices>['repos'];
  let kyc: KycService;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    process.env.BANK_NAME = 'Test Bank';
    process.env.BANK_ACCOUNT_NUMBER = '123456789';
    process.env.BANK_ROUTING_CODE = '987654';

    dataSource = await createInMemoryDb();
    ({ service, events, repos, kyc } = createWalletServices(dataSource));

    const moduleRef = await Test.createTestingModule({
      controllers: [WalletController, AdminDepositsController],
      providers: [
        { provide: WalletService, useValue: service },
        { provide: KycService, useValue: kyc },
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
      .overrideGuard(SelfGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await repos.account.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
      {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'house',
        balance: 0,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
    await dataSource.destroy();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('flags deposit and credits wallet after admin confirmation', async () => {
    const res = await request(app.getHttpServer())
      .post(`/wallet/${userId}/deposit/bank-transfer`)
      .set('Authorization', `Bearer ${userId}`)
      .send({ amount: 50, deviceId: 'dev1', currency: 'USD' })
      .expect(201);

    const deposit = await repos.pending.findOneByOrFail({
      reference: res.body.reference,
    });

    await completeBankTransferDepositWorkflow({
      service,
      repos,
      events,
      depositId: deposit.id,
      jobId: 'job-1',
      userId,
      amount: 50,
      currency: 'USD',
      expectedBalance: 50,
      confirmDeposit: async (id) => {
        await request(app.getHttpServer())
          .post(`/admin/deposits/${id}/confirm`)
          .set('Authorization', 'Bearer admin')
          .expect(201);
      },
      confirmedEvent: {
        accountId: userId,
        depositId: deposit.id,
        amount: 50,
        currency: 'USD',
      },
    });
  });
});

