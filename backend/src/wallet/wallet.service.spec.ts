import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { PendingDeposit } from './pending-deposit.entity';
import { WalletService } from './wallet.service';
import { EventPublisher } from '../events/events.service';
import { PaymentProviderService } from './payment-provider.service';
import { KycService } from './kyc.service';
import { SettlementService } from './settlement.service';
import * as fc from 'fast-check';

describe('WalletService reserve/commit/rollback flow', () => {
  let dataSource: DataSource;
  let service: WalletService;
  const events: EventPublisher = { emit: jest.fn() } as any;
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: 'text',
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: 'text',
      implementation: () => 'test',
    });
    let seq = 1;
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => {
        const id = seq.toString(16).padStart(32, '0');
        seq++;
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
      },
    });
    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [
        Account,
        JournalEntry,
        Disbursement,
        SettlementJournal,
        PendingDeposit,
      ],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();

    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const redis: any = { incr: jest.fn(), expire: jest.fn() };
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const pendingRepo = dataSource.getRepository(PendingDeposit);
    const provider = {} as unknown as PaymentProviderService;
    const kyc = {
      validate: jest.fn(),
      getDenialReason: jest.fn().mockResolvedValue(undefined),
    } as unknown as KycService;
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
    (service as any).pendingQueue = { add: jest.fn() };

    await accountRepo.save([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'user',
        balance: 1000,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'reserve',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'rake',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'prize',
        balance: 0,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('reserves, commits part and rolls back remainder', async () => {
    const ref = 'hand#1';
    await service.reserve(userId, 100, ref, 'USD');
    await service.commit(ref, 60, 5, 'USD');
    await service.rollback(userId, 40, ref, 'USD');

    const repo = dataSource.getRepository(Account);
    const user = await repo.findOneByOrFail({ id: userId });
    const reserve = await repo.findOneByOrFail({ name: 'reserve' });
    const prize = await repo.findOneByOrFail({ name: 'prize' });
    const rake = await repo.findOneByOrFail({ name: 'rake' });
    expect(user.balance).toBe(940);
    expect(reserve.balance).toBe(0);
    expect(prize.balance).toBe(55);
    expect(rake.balance).toBe(5);
  });

  it('cancels reservation when rolled back before commit', async () => {
    const ref = 'hand#2';
    const key = 'hand#flop#0';
    const accountRepo = dataSource.getRepository(Account);
    const userBefore = await accountRepo.findOneByOrFail({ id: userId });
    const reserveBefore = await accountRepo.findOneByOrFail({ name: 'reserve' });
    await service.reserve(userId, 50, ref, 'USD', key);
    await service.rollback(userId, 50, ref, 'USD', key);
    const userAfter = await accountRepo.findOneByOrFail({ id: userId });
    const reserveAfter = await accountRepo.findOneByOrFail({ name: 'reserve' });
    expect(userAfter.balance).toBe(userBefore.balance);
    expect(reserveAfter.balance).toBe(reserveBefore.balance);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const entry = await settleRepo.findOne({ where: { idempotencyKey: key } });
    expect(entry).toBeNull();
  });

  it(
    'maintains balance and journal invariants under random batches',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              reserve: fc.integer({ min: 1, max: 100 }),
              commit: fc.integer({ min: 0, max: 100 }),
              rake: fc.integer({ min: 0, max: 100 }),
            }).filter((t) => t.commit <= t.reserve && t.rake <= t.commit),
            { maxLength: 10 },
          ),
          async (batch) => {
            const accountRepo = dataSource.getRepository(Account);
            const journalRepo = dataSource.getRepository(JournalEntry);

            await journalRepo.clear();
            const accounts = await accountRepo.find();
            for (const acc of accounts) {
              acc.balance = 0;
            }
            await accountRepo.save(accounts);

            for (let i = 0; i < batch.length; i++) {
              const t = batch[i];
              const refId = `hand#${i}`;
              await service.reserve(userId, t.reserve, refId, 'USD');
              await service.commit(refId, t.commit, t.rake, 'USD');
              const rollbackAmt = t.reserve - t.commit;
              if (rollbackAmt > 0) {
                await service.rollback(userId, rollbackAmt, refId, 'USD');
              }
            }

            const totalBalance = await service.totalBalance();
            const totalJournal = await service.totalJournal();
            expect(totalBalance).toBe(0);
            expect(totalJournal).toBe(0);
          },
        ),
        { numRuns: 25 },
      );
    },
    20000,
  );

  it('reports credit balance separately', async () => {
    const repo = dataSource.getRepository(Account);
    const accountId = '22222222-2222-2222-2222-222222222222';
    await repo.save({
      id: accountId,
      name: 'creditUser',
      balance: 150,
      creditBalance: 50,
      currency: 'EUR',
    });
    const status = await service.status(accountId);
    expect(status).toEqual({
      kycVerified: false,
      denialReason: undefined,
      realBalance: 100,
      creditBalance: 50,
      currency: 'EUR',
    });
    const tx = await service.transactions(accountId);
    expect(tx.realBalance).toBe(100);
    expect(tx.creditBalance).toBe(50);
    expect(tx.transactions).toHaveLength(0);
    const pending = await service.pending(accountId);
    expect(pending.realBalance).toBe(100);
    expect(pending.creditBalance).toBe(50);
    expect(pending.transactions).toHaveLength(0);
  });
});
