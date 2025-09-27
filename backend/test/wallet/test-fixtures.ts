import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type Redis from 'ioredis';
import { DataSource, Repository } from 'typeorm';
import { EventPublisher } from '../../src/events/events.service';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { KycService } from '../../src/wallet/kyc.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { PendingDeposit } from '../../src/wallet/pending-deposit.entity';
import type { SettlementService } from '../../src/wallet/settlement.service';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { Transaction } from '../../src/wallet/transaction.entity';
import { TransactionType } from '../../src/wallet/transaction-type.entity';
import { TransactionStatus } from '../../src/wallet/transaction-status.entity';
import { TransactionTabEntity } from '../../src/wallet/transaction-tab.entity';
import { TransactionColumnEntity } from '../../src/wallet/transaction-column.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { createInMemoryRedis } from '../utils/mock-redis';
import { createPgMemDataSource } from '../utils/pgMemFactory';
import {
  reserveOperationArb,
  rollbackOperationArb,
  commitOperationArb,
  walletOperationArb,
  walletTransactionArb,
} from './arbitraries';

export {
  reserveOperationArb,
  rollbackOperationArb,
  commitOperationArb,
  walletOperationArb,
  walletTransactionArb,
} from './arbitraries';

export const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
export const RESERVE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';
export const HOUSE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000002';
export const RAKE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000003';
export const PRIZE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000004';

export interface WalletTestContext {
  dataSource: DataSource;
  accountRepo: Repository<Account>;
  journalRepo: Repository<JournalEntry>;
  disbursementRepo: Repository<Disbursement>;
  settlementRepo: Repository<SettlementJournal>;
  pendingDepositRepo: Repository<PendingDeposit>;
  service: WalletService;
  events: EventPublisher;
  redis: Redis;
  provider: PaymentProviderService;
  kyc: KycService;
}

export async function createWalletTestContext(): Promise<WalletTestContext> {
  const dataSource = await createPgMemDataSource({
    entities: [
      Account,
      JournalEntry,
      Disbursement,
      SettlementJournal,
      PendingDeposit,
      TransactionType,
      Transaction,
      TransactionStatus,
      TransactionTabEntity,
      TransactionColumnEntity,
    ],
  });

  const accountRepo = dataSource.getRepository(Account);
  const journalRepo = dataSource.getRepository(JournalEntry);
  const disbursementRepo = dataSource.getRepository(Disbursement);
  const settlementRepo = dataSource.getRepository(SettlementJournal);
  const pendingDepositRepo = dataSource.getRepository(PendingDeposit);

  const events: EventPublisher = {
    emit: jest.fn().mockResolvedValue(undefined),
  } as unknown as EventPublisher;
  const { redis } = createInMemoryRedis();
  const provider = {
    initiate3DS: jest.fn().mockResolvedValue({ id: randomUUID() }),
    getStatus: jest.fn().mockResolvedValue('approved'),
  } as unknown as PaymentProviderService;
  const kyc = {
    validate: jest.fn().mockResolvedValue(undefined),
    isVerified: jest.fn().mockResolvedValue(true),
  } as unknown as KycService;
  const settlementSvc = { cancel: jest.fn() } as unknown as SettlementService;

  const service = new WalletService(
    accountRepo as any,
    journalRepo as any,
    disbursementRepo as any,
    settlementRepo as any,
    pendingDepositRepo as any,
    events,
    redis,
    provider,
    kyc,
    settlementSvc,
    new ConfigService(),
  );
  (service as any).enqueueDisbursement = jest.fn();

  await accountRepo.save([
    { id: TEST_USER_ID, name: 'user', balance: 0, kycVerified: true, currency: 'USD' },
    {
      id: RESERVE_ACCOUNT_ID,
      name: 'reserve',
      balance: 0,
      kycVerified: true,
      currency: 'USD',
    },
    {
      id: HOUSE_ACCOUNT_ID,
      name: 'house',
      balance: 0,
      kycVerified: true,
      currency: 'USD',
    },
    {
      id: RAKE_ACCOUNT_ID,
      name: 'rake',
      balance: 0,
      kycVerified: true,
      currency: 'USD',
    },
    {
      id: PRIZE_ACCOUNT_ID,
      name: 'prize',
      balance: 0,
      kycVerified: true,
      currency: 'USD',
    },
  ]);

  return {
    dataSource,
    accountRepo,
    journalRepo,
    disbursementRepo,
    settlementRepo,
    pendingDepositRepo,
    service,
    events,
    redis,
    provider,
    kyc,
  };
}
