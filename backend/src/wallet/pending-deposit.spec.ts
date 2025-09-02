import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { PendingDeposit } from './pending-deposit.entity';
import { WalletService } from './wallet.service';
import { EventPublisher } from '../events/events.service';
import { PaymentProviderService } from './payment-provider.service';
import { KycService } from './kyc.service';
import { SettlementService } from './settlement.service';

describe('Pending deposits', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let removeJob: jest.Mock;
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redis: any = {
    incr: jest.fn(),
    expire: jest.fn(),
    set: jest.fn().mockResolvedValue('1'),
    del: jest.fn(),
  };
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    const db = newDb();
    db.public.registerFunction({ name: 'version', returns: 'text', implementation: () => 'pg-mem' });
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => userId,
    });
    dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Account, JournalEntry, Disbursement, SettlementJournal, PendingDeposit],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();

    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const pendingRepo = dataSource.getRepository(PendingDeposit);
    const provider = {} as unknown as PaymentProviderService;
    const kyc = {} as unknown as KycService;
    const settleSvc = new SettlementService(settleRepo);
    service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      pendingRepo,
      events,
      redis,
      provider,
      kyc,
      settleSvc,
    );
    removeJob = jest.fn();
    (service as any).pendingQueue = {
      add: jest.fn(),
      getJob: jest.fn().mockResolvedValue({ remove: removeJob }),
    };

    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000010', name: 'house', balance: 0, currency: 'USD' },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('confirms deposit and credits account', async () => {
    const res = await service.initiateBankTransfer(userId, 100, 'USD');
    const deposit = await dataSource.getRepository(PendingDeposit).findOneByOrFail({ reference: res.reference });
    await service.confirmPendingDeposit(deposit.id, 'admin');
    const accountRepo = dataSource.getRepository(Account);
    const user = await accountRepo.findOneByOrFail({ id: userId });
    expect(user.balance).toBe(100);
    await service.confirmPendingDeposit(deposit.id, 'admin');
    const userAgain = await accountRepo.findOneByOrFail({ id: userId });
    expect(userAgain.balance).toBe(100);
  });

  it('rejects deposit and notifies', async () => {
    const res = await service.initiateBankTransfer(userId, 50, 'USD');
    const deposit = await dataSource.getRepository(PendingDeposit).findOneByOrFail({ reference: res.reference });
    await service.rejectPendingDeposit(deposit.id, 'admin', 'bad');
    const updated = await dataSource.getRepository(PendingDeposit).findOneByOrFail({ id: deposit.id });
    expect(updated.status).toBe('rejected');
    expect(events.emit).toHaveBeenCalledWith(
      'wallet.deposit.rejected',
      expect.objectContaining({ depositId: deposit.id }),
    );
  });

  it('cancels deposit and prevents action required/listing', async () => {
    const res = await service.initiateBankTransfer(userId, 75, 'USD');
    const deposit = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ reference: res.reference });
    await service.cancelPendingDeposit(userId, deposit.id);
    expect((service as any).pendingQueue.getJob).toHaveBeenCalledWith(deposit.id);
    expect(removeJob).toHaveBeenCalled();
    const updated = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ id: deposit.id });
    expect(updated.status).toBe('rejected');
    await service.markActionRequiredIfPending(deposit.id);
    const after = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ id: deposit.id });
    expect(after.actionRequired).toBe(false);
    const list = await service.listPendingDeposits();
    expect(list.find((d) => d.id === deposit.id)).toBeUndefined();
  });
});
