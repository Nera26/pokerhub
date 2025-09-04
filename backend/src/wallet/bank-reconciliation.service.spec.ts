import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { BankReconciliationService } from './bank-reconciliation.service';
import { PendingDeposit } from './pending-deposit.entity';

describe('BankReconciliationService', () => {
  let dataSource: DataSource;
  let service: BankReconciliationService;
  const wallet = { confirmPendingDeposit: jest.fn() } as any;

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
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => '00000000-0000-0000-0000-000000000001',
    });
    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [PendingDeposit],
    });
    await dataSource.initialize();
    await dataSource.synchronize();
    service = new BankReconciliationService(
      dataSource.getRepository(PendingDeposit),
      wallet,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(() => {
    wallet.confirmPendingDeposit.mockReset();
  });

  it('confirms matching pending deposits', async () => {
    const repo = dataSource.getRepository(PendingDeposit);
    const deposit = await repo.save({
      userId: 'user',
      amount: 100,
      currency: 'USD',
      reference: 'abc',
      status: 'pending',
      expiresAt: new Date(Date.now() + 1000),
    });
    await service.reconcile([{ reference: 'abc', amount: 100 }]);
    expect(wallet.confirmPendingDeposit).toHaveBeenCalledWith(
      deposit.id,
      'system',
    );
  });

  it('logs unmatched entries', async () => {
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation();
    await service.reconcile([{ reference: 'missing', amount: 5 }]);
    expect(warn).toHaveBeenCalled();
  });
});
