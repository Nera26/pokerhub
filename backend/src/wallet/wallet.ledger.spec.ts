import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { WalletService } from './wallet.service';
import { EventPublisher } from '../events/events.service';
import { PaymentProviderService } from './payment-provider.service';
import { KycService } from './kyc.service';
import { runReconcile } from './reconcile.job';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('Wallet ledger invariants', () => {
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
      entities: [Account, JournalEntry, Disbursement, SettlementJournal],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();

    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const redis: any = { incr: jest.fn(), expire: jest.fn() };
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const provider = {} as unknown as PaymentProviderService;
    const kyc = { validate: jest.fn(), getDenialReason: jest.fn() } as unknown as KycService;
    service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      events,
      redis,
      provider,
      kyc,
    );

    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
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

  it(
    'ensures account deltas sum to zero for random batches',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc
              .record({
                reserve: fc.integer({ min: 1, max: 100 }),
                commit: fc.integer({ min: 0, max: 100 }),
                rake: fc.integer({ min: 0, max: 100 }),
              })
              .filter((t) => t.commit <= t.reserve && t.rake <= t.commit),
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
            const start = new Map(accounts.map((a) => [a.id, a.balance]));

            for (let i = 0; i < batch.length; i++) {
              const t = batch[i];
              const ref = `hand#${i}`;
              await service.reserve(userId, t.reserve, ref, 'USD');
              await service.commit(ref, t.commit, t.rake, 'USD');
              const rollbackAmt = t.reserve - t.commit;
              if (rollbackAmt > 0) {
                await service.rollback(userId, rollbackAmt, ref, 'USD');
              }
            }

            const end = await accountRepo.find();
            const deltaSum = end.reduce(
              (sum, acc) => sum + (acc.balance - (start.get(acc.id) ?? 0)),
              0,
            );
            expect(deltaSum).toBe(0);
          },
        ),
        { numRuns: 25 },
      );

      const accountRepo = dataSource.getRepository(Account);
      const reset = await accountRepo.find();
      for (const acc of reset) {
        acc.balance = 0;
      }
      await accountRepo.save(reset);
    },
    30000,
  );

  it(
    'maintains zero-sum balances and detects reconciliation discrepancies',
    async () => {
      const runInTmp = async (fn: () => Promise<void>) => {
        const cwd = process.cwd();
        const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'wallet-'));
        const backendDir = path.join(tmpRoot, 'backend');
        fs.mkdirSync(backendDir);
        process.chdir(backendDir);
        try {
          await fn();
        } finally {
          process.chdir(cwd);
        }
      };

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc
              .record({
                reserve: fc.integer({ min: 1, max: 100 }),
                commit: fc.integer({ min: 0, max: 100 }),
                rake: fc.integer({ min: 0, max: 100 }),
              })
              .filter((t) => t.commit <= t.reserve && t.rake <= t.commit),
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
              const ref = `hand#${i}`;
              await service.reserve(userId, t.reserve, ref, 'USD');
              await service.commit(ref, t.commit, t.rake, 'USD');
              const rollbackAmt = t.reserve - t.commit;
              if (rollbackAmt > 0) {
                await service.rollback(userId, rollbackAmt, ref, 'USD');
              }
            }

            const total = await service.totalBalance();
            expect(total).toBe(0);

            await runInTmp(() => runReconcile(service));

            const user = await accountRepo.findOneByOrFail({ id: userId });
            user.balance += 1;
            await accountRepo.save(user);
            await expect(
              runInTmp(() => runReconcile(service)),
            ).rejects.toThrow('wallet reconciliation discrepancies');
          },
        ),
        { numRuns: 25 },
      );
    },
    30000,
  );
});

