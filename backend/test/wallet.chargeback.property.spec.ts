import { DataSource } from 'typeorm';
import { DataType, newDb } from 'pg-mem';
import fc from 'fast-check';
import { randomUUID } from 'crypto';
import { Account } from '../src/wallet/account.entity';
import { JournalEntry } from '../src/wallet/journal-entry.entity';
import { Disbursement } from '../src/wallet/disbursement.entity';
import { SettlementJournal } from '../src/wallet/settlement-journal.entity';
import { PendingDeposit } from '../src/wallet/pending-deposit.entity';
import { WalletService } from '../src/wallet/wallet.service';
import { EventPublisher } from '../src/events/events.service';
import { PaymentProviderService } from '../src/wallet/payment-provider.service';
import { KycService } from '../src/wallet/kyc.service';
import { ChargebackMonitor } from '../src/wallet/chargeback.service';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { SettlementService } from '../src/wallet/settlement.service';
import { ConfigService } from '@nestjs/config';
import { createInMemoryRedis } from './utils/mock-redis';

jest.setTimeout(20000);

describe('ChargebackMonitor flags accounts', () => {
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const deviceId = 'dev1';
  const events = { emit: jest.fn() } as unknown as EventPublisher;

  async function setup() {
    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'test',
    });
    let seq = 1;
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: () => {
        const id = seq.toString(16).padStart(32, '0');
        seq++;
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
      },
    });
    const dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [
        Account,
        JournalEntry,
        Disbursement,
        SettlementJournal,
        PendingDeposit,
      ],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const pendingRepo = dataSource.getRepository(PendingDeposit);
    const { redis } = createInMemoryRedis();
    let tx = 0;
    const provider = {
      initiate3DS: jest
        .fn()
        .mockImplementation(async () => ({ id: `tx-${++tx}` })),
      getStatus: jest.fn(),
    } as unknown as PaymentProviderService;
    const kyc = { isVerified: jest.fn().mockResolvedValue(true) } as unknown as KycService;
    const analytics = { emit: jest.fn() } as unknown as AnalyticsService;
    const chargebacks = new ChargebackMonitor(redis as any);
    const settlementSvc = { cancel: jest.fn() } as unknown as SettlementService;
    const service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      pendingRepo,
      events,
      redis as any,
      provider,
      kyc,
      settlementSvc,
      new ConfigService(),
      analytics,
      chargebacks,
    );
    await accountRepo.save([
      { id: userId, name: 'user', balance: 0, kycVerified: true, currency: 'USD' },
      { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'house', balance: 1000, kycVerified: true, currency: 'USD' },
    ]);
    return { dataSource, service, provider, analytics };
  }

  it('rejects deposits once chargeback limit exceeded', async () => {
    process.env.WALLET_CHARGEBACK_ACCOUNT_LIMIT = '2';
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 1000 }), async (amt) => {
        const { dataSource, service, provider, analytics } = await setup();
        try {
          const first = await service.deposit(
            userId,
            amt,
            deviceId,
            '1.1.1.1',
            'USD',
          );
          await service.confirm3DS({
            eventId: randomUUID(),
            idempotencyKey: randomUUID(),
            providerTxnId: first.id,
            status: 'chargeback',
          });
          const second = await service.deposit(
            userId,
            amt,
            deviceId,
            '1.1.1.1',
            'USD',
          );
          await service.confirm3DS({
            eventId: randomUUID(),
            idempotencyKey: randomUUID(),
            providerTxnId: second.id,
            status: 'chargeback',
          });
          await expect(
            service.deposit(userId, amt, deviceId, '1.1.1.1', 'USD'),
          ).rejects.toThrow('Chargeback threshold exceeded');
          expect(analytics.emit).toHaveBeenCalledWith(
            'wallet.chargeback_flag',
            expect.objectContaining({ accountId: userId, deviceId, count: 2, limit: 2 }),
          );
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 10 },
    );
    delete process.env.WALLET_CHARGEBACK_ACCOUNT_LIMIT;
  });
});

