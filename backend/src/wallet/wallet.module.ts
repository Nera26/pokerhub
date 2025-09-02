import { Module, Injectable, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { WalletService } from './wallet.service';
import { SettlementService } from './settlement.service';
import { ChargebackMonitor } from './chargeback.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MetricsModule } from '../metrics/metrics.module';
import { WalletController } from '../routes/wallet.controller';
import { WebhookController } from './webhook.controller';
import { RateLimitGuard } from '../routes/rate-limit.guard';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../redis/redis.module';
import { startPayoutWorker } from './payout.worker';
import { startPendingDepositWorker } from './pending-deposit.worker';
import { PaymentProviderService } from './payment-provider.service';
import { KycService } from './kyc.service';
import { GeoIpService } from '../auth/geoip.service';
import { PendingDeposit } from './pending-deposit.entity';
import { AdminDepositsController } from '../routes/admin-deposits.controller';

@Injectable()
class PayoutWorker implements OnModuleInit {
  constructor(private readonly wallet: WalletService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    await startPayoutWorker(this.wallet);
  }
}

@Injectable()
class PendingDepositWorker implements OnModuleInit {
  constructor(private readonly wallet: WalletService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    await startPendingDepositWorker(this.wallet);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      JournalEntry,
      Disbursement,
      SettlementJournal,
      PendingDeposit,
    ]),
    EventsModule,
    RedisModule,
    AnalyticsModule,
    MetricsModule,
  ],
  providers: [
    WalletService,
    PayoutWorker,
    PendingDepositWorker,
    PaymentProviderService,
    KycService,
    SettlementService,
    RateLimitGuard,
    ChargebackMonitor,
    GeoIpService,
  ],
  controllers: [WalletController, WebhookController, AdminDepositsController],
  exports: [WalletService, KycService, SettlementService],
})
export class WalletModule {}
