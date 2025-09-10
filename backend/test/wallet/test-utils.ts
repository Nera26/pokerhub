import { createHmac } from 'crypto';
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
import { WebhookController } from '../../src/wallet/webhook.controller';
import { verifySignature } from '../../src/wallet/verify-signature';

export function createWalletServices(dataSource: DataSource) {
  const events: EventPublisher = { emit: jest.fn() } as any;
  const redis = new MockRedis();

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

export async function createWalletWebhookContext() {
  const ctx = await createWalletTestContext();
  const controller = new WebhookController(
    ctx.service,
    ctx.provider,
    ctx.redis as any,
  );
  return { ...ctx, controller };
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

export { createWalletTestContext as setupWalletTest };
export type WalletTestContext = Awaited<ReturnType<typeof createWalletTestContext>>;
