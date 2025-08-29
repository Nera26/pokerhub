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

describe('WalletService reserve/commit/rollback flow', () => {
  let dataSource: DataSource;
  let service: WalletService;
  const events: EventPublisher = { emit: jest.fn() } as any;

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
    const kyc = { validate: jest.fn() } as unknown as KycService;
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
    const userId = '11111111-1111-1111-1111-111111111111';
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
});
