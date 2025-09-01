import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { SettlementService } from '../../src/wallet/settlement.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { MockRedis } from '../utils/mock-redis';
import type { Street } from '../../src/game/state-machine';

function uuidSeq() {
  let seq = 1;
  return () => {
    const id = seq.toString(16).padStart(32, '0');
    seq++;
    return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
  };
}

describe('Settlement crash recovery', () => {
  let dataSource: DataSource;

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
    const nextUuid = uuidSeq();
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => nextUuid(),
    });
    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Account, JournalEntry, Disbursement, SettlementJournal],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  const userId = '11111111-1111-1111-1111-111111111111';
  const street: Street = 'flop';

  function createServices() {
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const events: EventPublisher = { emit: jest.fn() } as any;
    const redis = new MockRedis();
    const provider = { initiate3DS: jest.fn(), getStatus: jest.fn() } as unknown as PaymentProviderService;
    const kyc = { validate: jest.fn().mockResolvedValue(undefined), isVerified: jest.fn().mockResolvedValue(true) } as unknown as KycService;
    const settlementSvc = new SettlementService(settleRepo);
    const walletSvc = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      events,
      redis,
      provider,
      kyc,
      settlementSvc,
    );
    (walletSvc as any).enqueueDisbursement = jest.fn();
    return { walletSvc, settlementSvc };
  }

  beforeEach(async () => {
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    await journalRepo.createQueryBuilder().delete().execute();
    await disbRepo.createQueryBuilder().delete().execute();
    await settleRepo.createQueryBuilder().delete().execute();
    await accountRepo.createQueryBuilder().delete().execute();
    await accountRepo.save([
      { id: userId, name: 'user', balance: 1000, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000001', name: 'reserve', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000002', name: 'rake', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000003', name: 'prize', balance: 0, currency: 'USD' },
    ]);
  });

  it('retries commit after crash without double settlement', async () => {
    const tx = 'h1#flop#1';
    const idem = tx;
    const { walletSvc } = createServices();
    await walletSvc.reserve(userId, 100, tx, 'USD', idem);

    // simulate crash by creating new service instances
    const { walletSvc: wallet2, settlementSvc: settle2 } = createServices();

    await settle2.commit('h1', street, 1);
    await settle2.commit('h1', street, 1);
    await wallet2.commit(tx, 100, 5, 'USD', idem);
    await wallet2.commit(tx, 100, 5, 'USD', idem);

    const accounts = await dataSource.getRepository(Account).find();
    const sum = accounts.reduce((acc, a) => acc + a.balance, 0);
    const user = accounts.find((a) => a.id === userId);
    const reserve = accounts.find((a) => a.name === 'reserve');
    const prize = accounts.find((a) => a.name === 'prize');
    const rake = accounts.find((a) => a.name === 'rake');
    expect(user?.balance).toBe(900);
    expect(reserve?.balance).toBe(0);
    expect(prize?.balance).toBe(95);
    expect(rake?.balance).toBe(5);
    expect(sum).toBe(1000);
    const journals = await dataSource.getRepository(JournalEntry).find();
    expect(journals).toHaveLength(5);
    const entry = await dataSource
      .getRepository(SettlementJournal)
      .findOneByOrFail({ idempotencyKey: idem });
    expect(entry.status).toBe('committed');
  });

  it('retries cancel after crash without double settlement', async () => {
    const tx = 'h2#flop#1';
    const idem = tx;
    const { walletSvc } = createServices();
    await walletSvc.reserve(userId, 100, tx, 'USD', idem);

    const { walletSvc: wallet2, settlementSvc: settle2 } = createServices();
    await settle2.cancel('h2', street, 1);
    await settle2.cancel('h2', street, 1);
    await wallet2.rollback(userId, 100, tx, 'USD', idem);
    await wallet2.rollback(userId, 100, tx, 'USD', idem);

    const accounts = await dataSource.getRepository(Account).find();
    const sum = accounts.reduce((acc, a) => acc + a.balance, 0);
    const user = accounts.find((a) => a.id === userId);
    const reserve = accounts.find((a) => a.name === 'reserve');
    expect(user?.balance).toBe(1000);
    expect(reserve?.balance).toBe(0);
    expect(sum).toBe(1000);
    const journals = await dataSource.getRepository(JournalEntry).find();
    expect(journals).toHaveLength(4);
    const entries = await dataSource.getRepository(SettlementJournal).find();
    expect(entries).toHaveLength(0);
  });
});

