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
import { MockRedis } from '../utils/mock-redis';

jest.setTimeout(20000);

describe('WalletService credit/debit zero-sum property', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
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
    const redis = new MockRedis();
    const provider = {
      initiate3DS: jest.fn(),
      getStatus: jest.fn(),
    } as unknown as PaymentProviderService;
    const kyc = {
      validate: jest.fn().mockResolvedValue(undefined),
      isVerified: jest.fn().mockResolvedValue(true),
    } as unknown as KycService;
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
    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, kycVerified: true, currency: 'USD' },
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'reserve',
        balance: 0,
        kycVerified: false,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'house',
        balance: 0,
        kycVerified: false,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'rake',
        balance: 0,
        kycVerified: false,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'prize',
        balance: 0,
        kycVerified: false,
        currency: 'USD',
      },
    ]);
    const accounts = {
      user: await accountRepo.findOneByOrFail({ id: userId }),
      reserve: await accountRepo.findOneByOrFail({ name: 'reserve' }),
      house: await accountRepo.findOneByOrFail({ name: 'house' }),
      rake: await accountRepo.findOneByOrFail({ name: 'rake' }),
      prize: await accountRepo.findOneByOrFail({ name: 'prize' }),
    };
    return { dataSource, service, accounts };
  }

  const intArb = fc.integer({ min: 1, max: 1_000_000_000 });
  const depositArb = fc.record({
    type: fc.constant<'deposit'>('deposit'),
    amount: intArb,
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });
  const withdrawArb = fc.record({
    type: fc.constant<'withdraw'>('withdraw'),
    amount: intArb,
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });
  const reserveCommitArb = intArb.chain((amount) =>
    fc.record({
      type: fc.constant<'reserveCommit'>('reserveCommit'),
      amount: fc.constant(amount),
      rake: fc.integer({ min: 0, max: amount }),
      ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
      idempotencyKey: fc.hexaString({ minLength: 1, maxLength: 10 }),
    }),
  );
  const reserveRollbackArb = fc.record({
    type: fc.constant<'reserveRollback'>('reserveRollback'),
    amount: intArb,
    ref: fc.hexaString({ minLength: 1, maxLength: 10 }),
    idempotencyKey: fc.hexaString({ minLength: 1, maxLength: 10 }),
  });
  const opArb = fc.oneof(depositArb, withdrawArb, reserveCommitArb, reserveRollbackArb);
  const batchArb = fc.array(fc.array(opArb, { minLength: 1, maxLength: 3 }), { maxLength: 5 });

  it('maintains zero-sum across accounts', async () => {
    await fc.assert(
      fc.asyncProperty(batchArb, async (batches) => {
        const { dataSource, service, accounts } = await setup();
        try {
          for (const batch of batches) {
            await Promise.all(
              batch.map(async (op) => {
                switch (op.type) {
                  case 'deposit':
                    await (service as any).record('deposit', op.ref, [
                      { account: accounts.house, amount: -op.amount },
                      { account: accounts.user, amount: op.amount },
                    ]);
                    break;
                  case 'withdraw':
                    await (service as any).record('withdraw', op.ref, [
                      { account: accounts.user, amount: -op.amount },
                      { account: accounts.house, amount: op.amount },
                    ]);
                    break;
                  case 'reserveCommit':
                    await service.reserve(userId, op.amount, op.ref, 'USD', op.idempotencyKey);
                    await service.commit(op.ref, op.amount, op.rake, 'USD', op.idempotencyKey);
                    break;
                  case 'reserveRollback':
                    await service.reserve(userId, op.amount, op.ref, 'USD', op.idempotencyKey);
                    await service.rollback(userId, op.amount, op.ref, 'USD');
                    break;
                }
              }),
            );
          }
          const total =
            accounts.user.balance +
            accounts.reserve.balance +
            accounts.house.balance +
            accounts.rake.balance +
            accounts.prize.balance;
          expect(total).toBe(0);
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});

