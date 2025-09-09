import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { Account } from '../src/wallet/account.entity';
import { JournalEntry } from '../src/wallet/journal-entry.entity';
import { Disbursement } from '../src/wallet/disbursement.entity';
import { SettlementJournal } from '../src/wallet/settlement-journal.entity';
import { PendingDeposit } from '../src/wallet/pending-deposit.entity';
import { WalletService } from '../src/wallet/wallet.service';
import { EventPublisher } from '../src/events/events.service';
import { PaymentProviderService } from '../src/wallet/payment-provider.service';
import { KycService } from '../src/wallet/kyc.service';
import { SettlementService } from '../src/wallet/settlement.service';
import { AdminDepositGateway } from '../src/wallet/admin-deposit.gateway';
import { ConfigService } from '@nestjs/config';

// Mock Kafka consumer used by AdminDepositGateway
const mRun = jest.fn();
const mSubscribe = jest.fn();
const mConnect = jest.fn();
const mConsumer = { connect: mConnect, subscribe: mSubscribe, run: mRun } as any;

jest.mock('kafkajs', () => ({
  Kafka: jest.fn(() => ({ consumer: () => mConsumer })),
  Consumer: jest.fn(),
}));

// Simplify event schema parsing for tests
jest.mock('@shared/events', () => ({
  AdminDepositPendingEvent: { parse: (v: any) => v },
  AdminDepositRejectedEvent: { parse: (v: any) => v },
  AdminDepositConfirmedEvent: { parse: (v: any) => v },
}));

jest.setTimeout(20000);

describe('AdminDepositGateway deposit.pending', () => {
  let dataSource: DataSource;
  let service: WalletService;
  let gateway: AdminDepositGateway;
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redis: any = {
    incr: jest.fn().mockResolvedValue(1),
    incrby: jest.fn().mockResolvedValue(0),
    expire: jest.fn(),
    set: jest.fn().mockResolvedValue('1'),
    del: jest.fn(),
  };
  const userId = '11111111-1111-1111-1111-111111111111';
  const queue: any = {
    jobs: [] as { data: any; delay: number }[],
    add: jest.fn(async (_name: string, data: any, opts: any) => {
      queue.jobs.push({ data, delay: opts.delay });
    }),
    getJob: jest.fn(async () => null),
    async advanceBy(ms: number) {
      const ready = queue.jobs.filter((j: any) => j.delay <= ms);
      queue.jobs = queue.jobs.filter((j: any) => j.delay > ms);
      for (const job of ready) {
        await service.markActionRequiredIfPending(job.data.id, job.data.id);
      }
    },
  };

  beforeAll(async () => {
    process.env.BANK_NAME = 'bank';
    process.env.BANK_ACCOUNT_NUMBER = '123';
    process.env.BANK_ROUTING_CODE = '456';

    const db = newDb();
    db.public.registerFunction({ name: 'version', returns: 'text', implementation: () => 'pg-mem' });
    db.public.registerFunction({ name: 'current_database', returns: 'text', implementation: () => 'test' });
    db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'text', implementation: () => userId });

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
    const kyc = { isVerified: jest.fn().mockResolvedValue(true) } as unknown as KycService;
    const settleSvc = new SettlementService(settleRepo);

    gateway = new AdminDepositGateway({ get: () => '' } as ConfigService);
    gateway.server = { emit: jest.fn() } as any;

    events.emit = jest.fn(async (name: string, payload: any) => {
      if (name === 'admin.deposit.pending') {
        gateway.server.emit('deposit.pending', payload);
      }
    });

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

    (service as any).pendingQueue = queue;

    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000010', name: 'house', balance: 0, currency: 'USD' },
    ]);
  });

  afterAll(async () => {
    jest.useRealTimers();
    await dataSource.destroy();
  });

  it('emits deposit.pending after queue delay', async () => {
    const res = await service.initiateBankTransfer(userId, 50, 'dev1', '1.1.1.1', 'USD');
    const deposit = await dataSource
      .getRepository(PendingDeposit)
      .findOneByOrFail({ reference: res.reference });
    await queue.advanceBy(10_000);

    expect(gateway.server.emit).toHaveBeenCalledWith('deposit.pending', {
      depositId: deposit.id,
      jobId: deposit.id,
    });
  });
});

describe('AdminDepositGateway deposit.confirmed', () => {
  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  it('broadcasts deposit.confirmed events', async () => {
    process.env.NODE_ENV = 'development';
    const config = {
      get: jest.fn().mockReturnValue('localhost:9092'),
    } as unknown as ConfigService;
    const gateway = new AdminDepositGateway(config);
    const emit = jest.fn();
    (gateway as any).server = { emit };

    await gateway.onModuleInit();
    expect(mSubscribe).toHaveBeenCalledWith({ topic: 'admin.deposit.confirmed' });
    const eachMessage = mRun.mock.calls[0][0].eachMessage;

    const payload = { depositId: '22222222-2222-2222-2222-222222222222' };
    await eachMessage({
      topic: 'admin.deposit.confirmed',
      message: { value: Buffer.from(JSON.stringify(payload)) },
    });

    expect(emit).toHaveBeenCalledWith('deposit.confirmed', payload);
  });
});

