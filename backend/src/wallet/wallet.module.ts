import { Module, Injectable, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { WalletService } from './wallet.service';
import { WalletController } from '../routes/wallet.controller';
import { WebhookController } from './webhook.controller';
import { RateLimitGuard } from '../routes/rate-limit.guard';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../redis/redis.module';
import { startPayoutWorker } from './payout.worker';
import { PaymentProviderService } from './payment-provider.service';
import { KycService } from './kyc.service';

@Injectable()
class PayoutWorker implements OnModuleInit {
  constructor(private readonly wallet: WalletService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    await startPayoutWorker(this.wallet);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      JournalEntry,
      Disbursement,
      SettlementJournal,
    ]),
    EventsModule,
    RedisModule,
  ],
  providers: [
    WalletService,
    PayoutWorker,
    PaymentProviderService,
    KycService,
    RateLimitGuard,
  ],
  controllers: [WalletController, WebhookController],
  exports: [WalletService],
})
export class WalletModule {}
