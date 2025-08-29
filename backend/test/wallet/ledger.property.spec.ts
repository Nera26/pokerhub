import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import fc from 'fast-check';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';

jest.setTimeout(20000);

describe('WalletService ledger zero-sum property', () => {
  const events: EventPublisher = { emit: jest.fn() } as any;

  async function setup() {
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
    const dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Account, JournalEntry, Disbursement, SettlementJournal],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const redis: any = { incr: jest.fn().mockResolvedValue(0), expire: jest.fn() };
    const provider = { initiate3DS: jest.fn(), getStatus: jest.fn() } as unknown as PaymentProviderService;
    const kyc = { validate: jest.fn().mockResolvedValue(undefined) } as unknown as KycService;
    const service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      events,
      redis,
      provider,
      kyc,
    );
    (service as any).enqueueDisbursement = jest.fn();

    const accounts = await accountRepo.save([
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'a',
        balance: 0,
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'b',
        balance: 0,
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'c',
        balance: 0,
      },
    ]);
    return { dataSource, service, accounts };
  }

  const transferArb = fc
    .record({
      from: fc.integer({ min: 0, max: 2 }),
      to: fc.integer({ min: 0, max: 2 }),
      amount: fc.integer({ min: 1, max: 100 }),
    })
    .filter((op) => op.from !== op.to);

  it('maintains zero total balance after each batch', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(transferArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service, accounts } = await setup();
        try {
          for (let i = 0; i < ops.length; i++) {
            const { from, to, amount } = ops[i];
            await (service as any).record('test', `${i}`, [
              { account: accounts[from], amount: -amount },
              { account: accounts[to], amount: amount },
            ]);
            const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            expect(total).toBe(0);
          }
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});

