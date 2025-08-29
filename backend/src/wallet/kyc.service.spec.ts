import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { KycService } from './kyc.service';

describe('KycService', () => {
  let dataSource: DataSource;
  let service: KycService;
  let accountId: string;
  const cache: any = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
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

    const repo = dataSource.getRepository(Account);
    accountId = '11111111-1111-1111-1111-111111111111';
    await repo.save({
      id: accountId,
      name: 'user',
      balance: 0,
      currency: 'USD',
      kycVerified: false,
    });

    service = new KycService(repo, cache);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const repo = dataSource.getRepository(Account);
    const acc = await repo.findOneByOrFail({ id: accountId });
    acc.kycVerified = false;
    await repo.save(acc);
  });

  it('verifies when provider approves', async () => {
    jest
      .spyOn(service as any, 'callProvider')
      .mockResolvedValue({ allowed: true });
    jest.spyOn(service as any, 'checkFlag').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'checkGeoIp').mockResolvedValue(undefined);
    await service.verify(accountId, '1.1.1.1');
    const repo = dataSource.getRepository(Account);
    const acc = await repo.findOneByOrFail({ id: accountId });
    expect(acc.kycVerified).toBe(true);
  });

  it('throws when provider denies', async () => {
    jest
      .spyOn(service as any, 'callProvider')
      .mockResolvedValue({ allowed: false, reason: 'fail' });
    jest.spyOn(service as any, 'checkFlag').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'checkGeoIp').mockResolvedValue(undefined);
    await expect(service.verify(accountId, '1.1.1.1')).rejects.toThrow('fail');
  });

  it('rejects geo-blocked locations', async () => {
    jest
      .spyOn(service as any, 'callProvider')
      .mockResolvedValue({ allowed: true });
    jest.spyOn(service as any, 'checkFlag').mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'checkGeoIp')
      .mockResolvedValue('region US blocked');
    await expect(service.verify(accountId, '1.1.1.1')).rejects.toThrow(
      'region US blocked',
    );
  });
});

