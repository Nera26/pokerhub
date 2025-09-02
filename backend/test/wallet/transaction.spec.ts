import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { MockRedis } from '../utils/mock-redis';

describe('WalletService transactions', () => {
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
    const redis = new MockRedis();
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const provider = {
      initiate3DS: jest.fn(),
      getStatus: jest.fn(),
    } as unknown as PaymentProviderService;
    const kyc = {
      validate: jest.fn().mockResolvedValue(undefined),
      isVerified: jest.fn().mockResolvedValue(true),
    } as unknown as KycService;
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
    (service as any).enqueueDisbursement = jest.fn();
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
        name: 'house',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'rake',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'prize',
        balance: 0,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('reserves and commits funds with rake and idempotency', async () => {
    const tx = 'hand1#flop#1';
    await service.reserve('11111111-1111-1111-1111-111111111111', 100, tx, 'USD');
    await service.commit(tx, 100, 5, 'USD');
    // duplicate commit should be ignored
    await service.commit(tx, 100, 5, 'USD');
    const accounts = await dataSource.getRepository(Account).find();
    const user = accounts.find(
      (a) => a.id === '11111111-1111-1111-1111-111111111111',
    );
    const reserve = accounts.find((a) => a.name === 'reserve');
    const prize = accounts.find((a) => a.name === 'prize');
    const rake = accounts.find((a) => a.name === 'rake');
    expect(user?.balance).toBe(900);
    expect(reserve?.balance).toBe(0);
    expect(prize?.balance).toBe(95);
    expect(rake?.balance).toBe(5);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const journals = await journalRepo.find();
    expect(journals).toHaveLength(5); // reserve 2 entries + commit 3 entries
    expect(journals.every((j) => j.currency === 'USD')).toBe(true);
    expect(
      (events.emit as any).mock.calls.some(
        (c: any[]) => c[0] === 'wallet.debit',
      ),
    ).toBe(true);
    expect(
      (events.emit as any).mock.calls.some(
        (c: any[]) => c[0] === 'wallet.credit',
      ),
    ).toBe(true);
  });

  it('rolls back reservation', async () => {
    const tx = 'hand2#flop#1';
    await service.reserve('11111111-1111-1111-1111-111111111111', 50, tx, 'USD');
    await service.rollback('11111111-1111-1111-1111-111111111111', 50, tx, 'USD');
    const user = await dataSource
      .getRepository(Account)
      .findOneBy({ id: '11111111-1111-1111-1111-111111111111' });
    const reserve = await dataSource
      .getRepository(Account)
      .findOneBy({ name: 'reserve' });
    expect(user?.balance).toBe(900);
    expect(reserve?.balance).toBe(0);
  });
});
