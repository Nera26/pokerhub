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

describe('WalletService history', () => {
  let dataSource: DataSource;
  let service: WalletService;

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
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const events = { emit: jest.fn() } as unknown as EventPublisher;
    const redis: any = {
      incr: jest.fn().mockResolvedValue(0),
      incrby: jest.fn().mockResolvedValue(0),
      decrby: jest.fn().mockResolvedValue(0),
      expire: jest.fn(),
    };
    const provider = { initiate3DS: jest.fn(), getStatus: jest.fn() } as unknown as PaymentProviderService;
    const kyc = { validate: jest.fn().mockResolvedValue(undefined) } as unknown as KycService;
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
    await accountRepo.save({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'user',
      balance: 0,
      kycVerified: true,
      currency: 'USD',
    });
    await journalRepo.save({
      id: '22222222-2222-2222-2222-222222222222',
      accountId: '11111111-1111-1111-1111-111111111111',
      account: {
        id: '11111111-1111-1111-1111-111111111111',
      } as Account,
      amount: 100,
      currency: 'USD',
      refType: 'deposit',
      refId: 'r1',
      hash: 'h1',
    });
    await disbRepo.save({
      id: '33333333-3333-3333-3333-333333333333',
      accountId: '11111111-1111-1111-1111-111111111111',
      amount: 50,
      idempotencyKey: 'k1',
      status: 'pending',
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('returns ledger transactions', async () => {
    const res = await service.transactions(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      id: '22222222-2222-2222-2222-222222222222',
      type: 'deposit',
      amount: 100,
      currency: 'USD',
    });
  });

  it('returns pending disbursements', async () => {
    const res = await service.pending(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(res).toHaveLength(1);
    expect(res[0]).toMatchObject({
      id: '33333333-3333-3333-3333-333333333333',
      amount: 50,
      status: 'pending',
    });
  });
});
