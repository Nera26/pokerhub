import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Test } from '@nestjs/testing';
import type { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';

import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { PendingDeposit } from '../../src/wallet/pending-deposit.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { SettlementService } from '../../src/wallet/settlement.service';
import { WalletController } from '../../src/routes/wallet.controller';
import AdminDepositsController from '../../src/routes/admin-deposits.controller';
import { AuthGuard } from '../../src/auth/auth.guard';
import { RateLimitGuard } from '../../src/routes/rate-limit.guard';
import { SelfGuard } from '../../src/auth/self.guard';
import { AdminGuard } from '../../src/auth/admin.guard';
// Coupled with pending-deposit.worker.ts; keep this test in sync with worker logic.

/**
 * Integration test of bank transfer deposit via WalletController:
 * player initiates deposit, background worker flags it, admin confirms, and balance updates.
 */
describe('WalletController bank transfer workflow', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let service: WalletService;
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redis: any = {
    incr: jest.fn(),
    incrby: jest.fn().mockResolvedValue(0),
    expire: jest.fn(),
    set: jest.fn().mockResolvedValue('1'),
    del: jest.fn(),
  };
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    process.env.BANK_NAME = 'Test Bank';
    process.env.BANK_ACCOUNT_NUMBER = '123456789';
    process.env.BANK_ROUTING_CODE = '987654';

    const db = newDb();
    db.public.registerFunction({ name: 'version', returns: 'text', implementation: () => 'pg-mem' });
    db.public.registerFunction({ name: 'current_database', returns: 'text', implementation: () => 'test' });
    db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'text', implementation: () => userId });

    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Account, JournalEntry, Disbursement, SettlementJournal, PendingDeposit],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();

    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const pendingRepo = dataSource.getRepository(PendingDeposit);
    const provider = {} as unknown as PaymentProviderService;
    const kyc = { isVerified: jest.fn().mockResolvedValue(true) } as unknown as KycService;
    const settleSvc = new SettlementService(settleRepo);

    service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      pendingRepo,
      events,
      redis,
      provider,
      kyc,
      settleSvc,
    );
    // avoid bullmq dependency
    (service as any).pendingQueue = { add: jest.fn(), getJob: jest.fn(async () => null) };

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

    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000010', name: 'house', balance: 0, currency: 'USD' },
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

    const repo = dataSource.getRepository(PendingDeposit);
    const deposit = await repo.findOneByOrFail({ reference: res.body.reference });

    // simulate worker processing (see pending-deposit.worker.ts)
    await service.markActionRequiredIfPending(deposit.id, 'job-1');
    const flagged = await repo.findOneByOrFail({ id: deposit.id });
    expect(flagged.actionRequired).toBe(true);
    expect(events.emit).toHaveBeenCalledWith('admin.deposit.pending', {
      depositId: deposit.id,
      jobId: 'job-1',
    });

    await request(app.getHttpServer())
      .post(`/admin/deposits/${deposit.id}/confirm`)
      .set('Authorization', 'Bearer admin')
      .expect(201);

    const accountRepo = dataSource.getRepository(Account);
    const user = await accountRepo.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(50);
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.deposit.confirmed',
      expect.objectContaining({ accountId: userId, depositId: deposit.id, amount: 50, currency: 'USD' }),
    );
  });
});

