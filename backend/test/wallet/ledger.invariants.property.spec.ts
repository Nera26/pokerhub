import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { PendingDeposit } from '../../src/wallet/pending-deposit.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { runReconcile } from '../../src/wallet/reconcile.job';
import { SettlementService } from '../../src/wallet/settlement.service';
import { ConfigService } from '@nestjs/config';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { assertLedgerInvariant, resetLedger, walletBatchArb, runWalletBatch } from './test-utils';

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

describe('Wallet ledger invariants', () => {
  let dataSource: DataSource;
  let service: WalletService;
  const events: EventPublisher = { emit: jest.fn() } as any;
  const userId = '11111111-1111-1111-1111-111111111111';
  const reserveId = '00000000-0000-0000-0000-000000000001';
  const rakeId = '00000000-0000-0000-0000-000000000002';
  const prizeId = '00000000-0000-0000-0000-000000000003';

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
    const kyc = { validate: jest.fn(), getDenialReason: jest.fn() } as unknown as KycService;
    const settleSvc = new SettlementService(settleRepo);
    const config = {
      get: jest.fn().mockReturnValue(['reserve', 'house', 'rake', 'prize']),
    } as unknown as ConfigService;
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
      config,
    );

    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
      { id: reserveId, name: 'reserve', balance: 0, currency: 'USD' },
      { id: rakeId, name: 'rake', balance: 0, currency: 'USD' },
      { id: prizeId, name: 'prize', balance: 0, currency: 'USD' },
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
          walletBatchArb(),
          async (batch) => {
            const accountRepo = dataSource.getRepository(Account);
            const journalRepo = dataSource.getRepository(JournalEntry);
            await runWalletBatch(
              service,
              { account: accountRepo, journal: journalRepo },
              batch,
              userId,
            );
          },
        ),
        { numRuns: 25 },
      );
    },
    30000,
  );

  it(
    'maintains zero-sum balances and detects reconciliation discrepancies',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          walletBatchArb(),
          async (batch) => {
            const accountRepo = dataSource.getRepository(Account);
            const journalRepo = dataSource.getRepository(JournalEntry);

            await runWalletBatch(
              service,
              { account: accountRepo, journal: journalRepo },
              batch,
              userId,
            );

            await runInTmp(() => runReconcile(service, events));

            const user = await accountRepo.findOneByOrFail({ id: userId });
            user.balance += 1;
            await accountRepo.save(user);
            await runInTmp(async () => {
              await expect(runReconcile(service, events)).rejects.toThrow(
                'wallet reconciliation discrepancies',
              );
              const dir = path.join(process.cwd(), '../storage');
              const today = new Date().toISOString().slice(0, 10);
              const file = path.join(dir, `reconcile-${today}.json`);
              expect(fs.existsSync(file)).toBe(true);
            });
          },
        ),
      { numRuns: 25 },
    );
  },
  30000,
  );

  it(
    'journal entries net to zero and reconcile matches aggregated logs',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc
              .record({
                kind: fc.constantFrom('hand', 'tournament'),
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

            await resetLedger({ account: accountRepo, journal: journalRepo });

            const expected = new Map<string, number>([
              [userId, 0],
              [reserveId, 0],
              [rakeId, 0],
              [prizeId, 0],
            ]);

            const add = (id: string, amt: number) => {
              expected.set(id, (expected.get(id) ?? 0) + amt);
            };

            for (let i = 0; i < batch.length; i++) {
              const t = batch[i];
              const ref = `${t.kind}#${i}`;
              await service.reserve(userId, t.reserve, ref, 'USD');
              add(userId, -t.reserve);
              add(reserveId, t.reserve);

              if (t.commit > 0) {
                await service.commit(ref, t.commit, t.rake, 'USD');
                add(reserveId, -t.commit);
                add(prizeId, t.commit - t.rake);
                add(rakeId, t.rake);
              }

              const rollbackAmt = t.reserve - t.commit;
              if (rollbackAmt > 0) {
                await service.rollback(userId, rollbackAmt, ref, 'USD');
                add(reserveId, -rollbackAmt);
                add(userId, rollbackAmt);
              }

              const entries = await journalRepo.find({ where: { refId: ref } });
              const total = entries.reduce((s, e) => s + Number(e.amount), 0);
              expect(total).toBe(0);
            }

            await assertLedgerInvariant(service);

            await runInTmp(() => runReconcile(service, events));

            const accs = await accountRepo.find();
            for (const acc of accs) {
              expect(acc.balance).toBe(expected.get(acc.id));
            }

            const totalExpected = Array.from(expected.values()).reduce(
              (a, b) => a + b,
              0,
            );
            expect(totalExpected).toBe(0);
          },
        ),
        { numRuns: 25 },
      );
    },
    30000,
  );

  it('emits alert on log sum mismatch', async () => {
    (events.emit as jest.Mock).mockClear();
    const day = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await runInTmp(async () => {
      const dir = path.join(process.cwd(), '../storage/hand-logs');
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${day}.jsonl`);
      fs.writeFileSync(file, JSON.stringify({ accounts: { a: 5 } }) + '\n');
      await expect(runReconcile(service, events)).rejects.toThrow(
        'wallet reconciliation discrepancies',
      );
    });
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.reconcile.mismatch',
      { date: day, total: 5 },
    );
  });
});

