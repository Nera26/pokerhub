import { DataSource } from 'typeorm';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import AdminDepositsController from '../../src/routes/admin-deposits.controller';
import { createInMemoryDb, createWalletServices, completeBankTransferDepositWorkflow } from './test-utils';

/**
 * User initiates bank transfer -> worker flags after 10s -> admin confirms -> wallet balance increases.
 * Kafka/WebSocket events are mocked via EventPublisher spy.
 */
describe('Bank transfer deposit workflow', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let events: EventPublisher;
  let repos: ReturnType<typeof createWalletServices>['repos'];

  const userId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    process.env.BANK_NAME = 'Test Bank';
    process.env.BANK_ACCOUNT_NUMBER = '123456789';
    process.env.BANK_ROUTING_CODE = '987654';

    dataSource = await createInMemoryDb();
    ({ service, events, repos } = createWalletServices(dataSource));

    await repos.account.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
      {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'house',
        balance: 0,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('credits wallet after admin confirms flagged deposit', async () => {
    const start = await repos.account.findOneByOrFail({ id: userId });

    const res = await service.initiateBankTransfer(userId, 50, 'dev1', '1.1.1.1', 'USD');
    const deposit = await repos.pending.findOneByOrFail({ reference: res.reference });

    // worker schedules check after 10s
    expect((service as any).pendingQueue.add).toHaveBeenCalledWith(
      'check',
      expect.objectContaining({ id: deposit.id }),
      expect.objectContaining({ delay: 10_000 }),
    );

    const controller = new AdminDepositsController(service);

    await completeBankTransferDepositWorkflow({
      service,
      repos,
      events,
      depositId: deposit.id,
      jobId: deposit.id,
      userId,
      amount: 50,
      currency: 'USD',
      expectedBalance: start.balance + 50,
      confirmDeposit: (id) => controller.confirm(id, { userId: 'admin' } as any),
      confirmedEvent: { accountId: userId, amount: 50, currency: 'USD' },
    });
  });
});

