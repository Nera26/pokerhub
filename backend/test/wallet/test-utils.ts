import { createHmac } from 'crypto';
import { DataSource, Repository } from 'typeorm';
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
import { MockRedis } from '../utils/mock-redis';
import { ConfigService } from '@nestjs/config';
import { WebhookController } from '../../src/wallet/webhook.controller';
import { verifySignature } from '../../src/wallet/verify-signature';
import * as fc from 'fast-check';

// Re-exported for compatibility with legacy tests
export { createDataSource as createInMemoryDb } from '../utils/pgMem';

export function createWalletServices(dataSource: DataSource) {
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redis = new MockRedis();
  const redisStore = (redis as any).store as Map<string, any>;

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
  await repo.save([
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'user',
      balance: 1000,
      currency: 'USD',
    },
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'reserve',
      balance: 0,
      currency: 'USD',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'house',
      balance: 0,
      currency: 'USD',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'rake',
      balance: 0,
      currency: 'USD',
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'prize',
      balance: 0,
      currency: 'USD',
    },
  ]);
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
