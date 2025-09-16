import { createHmac } from 'crypto';
import { DataSource, Repository, EntityTarget } from 'typeorm';
import { createDataSource } from '../utils/pgMem';
import * as handLedger from '../../src/wallet/hand-ledger';
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
import { createInMemoryRedis } from '../utils/mock-redis';
import { ConfigService } from '@nestjs/config';
import { WebhookController } from '../../src/wallet/webhook.controller';
import { verifySignature } from '../../src/wallet/verify-signature';
import * as fc from 'fast-check';
import { walletAccounts } from './accounts.fixture';

export async function createInMemoryDb(
  entities: EntityTarget<any>[] = [
    Account,
    JournalEntry,
    Disbursement,
    SettlementJournal,
    PendingDeposit,
  ],
): Promise<DataSource> {
  return createDataSource(entities);
}

export { walletAccounts };

export function createWalletServices(dataSource: DataSource) {
  const events: EventPublisher = { emit: jest.fn() } as any;
  const { redis, store: redisStore } = createInMemoryRedis();

  const provider: any = {
    initiate3DS: jest.fn().mockResolvedValue({ id: 'tx' }),
    getStatus: jest.fn().mockResolvedValue('approved'),
    drainQueue: jest.fn().mockResolvedValue(undefined),
    registerHandler: jest.fn(),
    confirm3DS: jest.fn(),
    verifySignature,
  } as unknown as PaymentProviderService;

  const kyc: any = {
    isVerified: jest.fn().mockResolvedValue(true),
    validate: jest.fn(),
    getDenialReason: jest.fn().mockResolvedValue(undefined),
  } as KycService;

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
  provider.confirm3DS = jest.fn(async (payload: any) => {
    const intent = payload?.data?.object ?? {};
    const status =
      intent.status === 'succeeded'
        ? 'approved'
        : intent.status === 'requires_action'
          ? 'risky'
          : 'chargeback';
    const event = {
      eventId: payload?.id ?? intent.id,
      idempotencyKey: intent.metadata?.idempotencyKey ?? intent.id,
      providerTxnId: intent.id,
      status,
    };
    await redis.del(`wallet:webhook:${event.eventId}`);
    await service.confirm3DS(event as any);
  });

  return {
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
    redisStore,
    settleSvc,
  };
}

export type WalletRepos = ReturnType<typeof createWalletServices>['repos'];

export async function completeBankTransferDepositWorkflow(options: {
  service: WalletService;
  repos: WalletRepos;
  events: EventPublisher;
  depositId: string;
  jobId: string;
  userId: string;
  amount: number;
  currency: string;
  confirmDeposit: (depositId: string) => Promise<void> | void;
  expectedBalance?: number;
  pendingEvent?: Record<string, unknown>;
  confirmedEvent?: Record<string, unknown>;
}) {
  const {
    service,
    repos,
    events,
    depositId,
    jobId,
    userId,
    amount,
    currency,
    confirmDeposit,
    expectedBalance,
    pendingEvent,
    confirmedEvent,
  } = options;

  await service.markActionRequiredIfPending(depositId, jobId);

  const flaggedDeposit = await repos.pending.findOneByOrFail({ id: depositId });
  expect(flaggedDeposit.actionRequired).toBe(true);

  const pendingMatcher = expect.objectContaining(pendingEvent ?? { depositId, jobId });
  expect(events.emit).toHaveBeenCalledWith('admin.deposit.pending', pendingMatcher);

  await Promise.resolve(confirmDeposit(depositId));

  const user = await repos.account.findOneByOrFail({ id: userId });
  if (expectedBalance !== undefined) {
    expect(user.balance).toBe(expectedBalance);
  }

  const confirmedMatcher = expect.objectContaining(
    confirmedEvent ?? { accountId: userId, amount, currency },
  );
  expect(events.emit).toHaveBeenCalledWith('wallet.deposit.confirmed', confirmedMatcher);

  return { user, flaggedDeposit };
}

export async function createWalletTestContext() {
  const dataSource = await createDataSource([
    Account,
    JournalEntry,
    Disbursement,
    SettlementJournal,
    PendingDeposit,
  ]);
  return { dataSource, ...createWalletServices(dataSource) };
}

export async function setupTestWallet(opts: { mockLedger?: boolean } = {}) {
  const ctx = await createWalletTestContext();
  let writeHandLedgerMock: jest.SpyInstance | undefined;
  if (opts.mockLedger !== false) {
    writeHandLedgerMock = jest
      .spyOn(handLedger, 'writeHandLedger')
      .mockResolvedValue(undefined);
  }
  return { ...ctx, writeHandLedger: writeHandLedgerMock };
}

export async function createWalletWebhookContext() {
  const ctx = await createWalletTestContext();
  const controller = new WebhookController(
    ctx.service,
    ctx.provider,
    ctx.redis as any,
  );
  return { ...ctx, controller };
}

export async function seedWalletAccounts(repo: Repository<Account>) {
  await repo.save(walletAccounts);
}

export async function resetLedger(repos: {
  account: Repository<Account>;
  journal: Repository<JournalEntry>;
}) {
  await repos.journal.clear();
  const accounts = await repos.account.find();
  for (const acc of accounts) {
    acc.balance = 0;
  }
  await repos.account.save(accounts);
}

export const walletBatchArb = () =>
  fc.array(
    fc
      .record({
        reserve: fc.integer({ min: 1, max: 100 }),
        commit: fc.integer({ min: 0, max: 100 }),
        rake: fc.integer({ min: 0, max: 100 }),
      })
      .filter((t) => t.commit <= t.reserve && t.rake <= t.commit),
    { maxLength: 10 },
  );

export async function runWalletBatch(
  service: WalletService,
  repos: { account: Repository<Account>; journal: Repository<JournalEntry> },
  batch: { reserve: number; commit: number; rake: number }[],
  userId = '11111111-1111-1111-1111-111111111111',
) {
  await resetLedger(repos);
  for (let i = 0; i < batch.length; i++) {
    const t = batch[i];
    const refId = `hand#${i}`;
    await service.reserve(userId, t.reserve, refId, 'USD');
    await service.commit(refId, t.commit, t.rake, 'USD');
    const rollbackAmt = t.reserve - t.commit;
    if (rollbackAmt > 0) {
      await service.rollback(userId, rollbackAmt, refId, 'USD');
    }
  }
  await assertLedgerInvariant(service);
}

export async function expectLedgerBalances(
  repos: {
    account: Repository<Account>;
    journal: Repository<JournalEntry>;
  },
  expected: {
    user: number;
    reserve: number;
    prize: number;
    rake: number;
    journals: number;
    total?: number;
  },
  userId = '11111111-1111-1111-1111-111111111111',
) {
  const accounts = await repos.account.find();
  const user = accounts.find((a) => a.id === userId);
  const reserve = accounts.find((a) => a.name === 'reserve');
  const prize = accounts.find((a) => a.name === 'prize');
  const rake = accounts.find((a) => a.name === 'rake');
  expect(user?.balance).toBe(expected.user);
  expect(reserve?.balance).toBe(expected.reserve);
  expect(prize?.balance).toBe(expected.prize);
  expect(rake?.balance).toBe(expected.rake);
  if (expected.total !== undefined) {
    const sum = accounts.reduce((acc, a) => acc + a.balance, 0);
    expect(sum).toBe(expected.total);
  }
  const journals = await repos.journal.find();
  expect(journals).toHaveLength(expected.journals);
  return { accounts, journals };
}

export function signProviderPayload(body: unknown): string {
  const secret = process.env.PROVIDER_WEBHOOK_SECRET ?? '';
  return createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
}

export async function reconcileSum(service: WalletService) {
  const report = await service.reconcile();
  const total = report.reduce(
    (sum, row) => sum + row.balance - row.journal,
    0,
  );
  return { report, total };
}

export async function assertLedgerInvariant(service: WalletService) {
  const [totalBalance, totalJournal] = await Promise.all([
    service.totalBalance(),
    service.totalJournal(),
  ]);
  expect(totalBalance).toBe(0);
  expect(totalJournal).toBe(0);
}

export { createWalletTestContext as setupWalletTest };
export type WalletTestContext = Awaited<ReturnType<typeof createWalletTestContext>>;
