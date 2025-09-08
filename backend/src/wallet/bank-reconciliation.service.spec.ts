import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { BankReconciliationService } from './bank-reconciliation.service';
import { PendingDeposit } from './pending-deposit.entity';
import { EventPublisher } from '../events/events.service';

describe('BankReconciliationService', () => {
  let dataSource: DataSource;
  let service: BankReconciliationService;
  const wallet = { confirmPendingDeposit: jest.fn() } as any;
  let events: EventPublisher;
  let send: jest.Mock;

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
    send = jest.fn().mockResolvedValue(undefined);
    const producer: any = {
      send,
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    const config: any = { get: () => '' };
    events = new EventPublisher(config, producer);
    service = new BankReconciliationService(
      dataSource.getRepository(PendingDeposit),
      wallet,
      events,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
    await events.onModuleDestroy();
  });

  beforeEach(() => {
    wallet.confirmPendingDeposit.mockReset();
    send.mockReset();
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

  it('logs unmatched entries and emits event', async () => {
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation();
    await service.reconcile([{ reference: 'missing', amount: 5 }]);
    expect(warn).toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(send.mock.calls[0][0].messages[0].value);
    expect(payload).toEqual({ date: expect.any(String), total: 5 });
  });
});
