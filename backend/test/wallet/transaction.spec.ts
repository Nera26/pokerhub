import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';

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
      entities: [Account, JournalEntry, Disbursement],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const redis: any = {
      incr: jest.fn().mockResolvedValue(0),
      expire: jest.fn(),
    };
    const disbRepo = dataSource.getRepository(Disbursement);
    service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      events,
      redis,
    );
    (service as any).enqueueDisbursement = jest.fn();
    await accountRepo.save([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'user',
        balance: 1000,
      },
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'reserve',
        balance: 0,
      },
      { id: '00000000-0000-0000-0000-000000000002', name: 'house', balance: 0 },
      { id: '00000000-0000-0000-0000-000000000003', name: 'rake', balance: 0 },
      { id: '00000000-0000-0000-0000-000000000004', name: 'prize', balance: 0 },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('reserves and commits funds with rake and idempotency', async () => {
    const tx = 'hand1#flop#1';
    await service.reserve('11111111-1111-1111-1111-111111111111', 100, tx);
    await service.commit(tx, 100, 5);
    // duplicate commit should be ignored
    await service.commit(tx, 100, 5);
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
    const journalCount = await dataSource.getRepository(JournalEntry).count();
    expect(journalCount).toBe(5); // reserve 2 entries + commit 3 entries
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
    await service.reserve('11111111-1111-1111-1111-111111111111', 50, tx);
    await service.rollback('11111111-1111-1111-1111-111111111111', 50, tx);
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
