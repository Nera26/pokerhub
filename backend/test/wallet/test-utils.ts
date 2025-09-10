import { DataSource } from 'typeorm';
import { createDataSource } from '../utils/pgMem';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { PendingDeposit } from '../../src/wallet/pending-deposit.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { SettlementService } from '../../src/wallet/settlement.service';
import { MockRedis } from '../utils/mock-redis';
import { ConfigService } from '@nestjs/config';

export async function setupWalletTest() {
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redis = new MockRedis();

  const provider: any = {
    initiate3DS: jest.fn().mockResolvedValue({ id: 'tx' }),
    getStatus: jest.fn().mockResolvedValue('approved'),
  } as unknown as PaymentProviderService;

  const kyc: any = {
    isVerified: jest.fn().mockResolvedValue(true),
    validate: jest.fn(),
    getDenialReason: jest.fn().mockResolvedValue(undefined),
  } as KycService;

  const dataSource = await createDataSource([
    Account,
    JournalEntry,
    Disbursement,
    SettlementJournal,
    PendingDeposit,
  ]);

  const accountRepo = dataSource.getRepository(Account);
  const journalRepo = dataSource.getRepository(JournalEntry);
  const disbRepo = dataSource.getRepository(Disbursement);
  const settleRepo = dataSource.getRepository(SettlementJournal);
  const pendingRepo = dataSource.getRepository(PendingDeposit);

  const settleSvc = new SettlementService(settleRepo);

  const config = {
    get: jest.fn().mockReturnValue(['reserve', 'house', 'rake', 'prize']),
  } as unknown as ConfigService;

  const service = new WalletService(
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
    config,
  );
  (service as any).enqueueDisbursement = jest.fn();
  (service as any).pendingQueue = { add: jest.fn(), getJob: jest.fn() };

  return {
    dataSource,
    service,
    repos: {
      dataSource,
      account: accountRepo,
      journal: journalRepo,
      disbursement: disbRepo,
      settlement: settleRepo,
      pending: pendingRepo,
    },
    events,
    provider,
    kyc,
    redis,
  };
}

export type WalletTestContext = Awaited<ReturnType<typeof setupWalletTest>>;
