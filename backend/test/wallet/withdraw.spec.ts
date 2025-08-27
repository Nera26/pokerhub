import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';

describe('WalletService withdraw', () => {
  let dataSource: DataSource;
  let service: WalletService;
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redis: any = {
    store: {} as Record<string, number>,
    async incr(key: string) {
      this.store[key] = (this.store[key] ?? 0) + 1;
      return this.store[key];
    },
    async expire() {},
  };

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
      entities: [Account, JournalEntry],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    service = new WalletService(accountRepo, journalRepo, events, redis);
    await accountRepo.save([
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'user',
        balance: 1000,
        kycVerified: true,
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'house',
        balance: 0,
        kycVerified: false,
      },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('requires KYC verification', async () => {
    const repo = dataSource.getRepository(Account);
    const user = await repo.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    user.kycVerified = false;
    await repo.save(user);
    await expect(
      service.withdraw(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        100,
        'dev1',
        '1.1.1.1',
      ),
    ).rejects.toThrow('KYC required');
    user.kycVerified = true;
    await repo.save(user);
  });

  it('enforces rate limits', async () => {
    await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd1',
      '2.2.2.2',
    );
    await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd1',
      '2.2.2.2',
    );
    await service.withdraw(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      100,
      'd1',
      '2.2.2.2',
    );
    await expect(
      service.withdraw(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        100,
        'd1',
        '2.2.2.2',
      ),
    ).rejects.toThrow('Rate limit exceeded');
  });
});
