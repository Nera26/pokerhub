import { Module, Injectable, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { SettlementJournal } from './settlement-journal.entity';
import { WalletService } from './wallet.service';
import { WalletController } from '../routes/wallet.controller';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../redis/redis.module';
import { startDisbursementWorker } from './disbursement.worker';
import { PaymentProviderService } from './payment-provider.service';

@Injectable()
class DisbursementWorker implements OnModuleInit {
  constructor(private readonly wallet: WalletService) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    await startDisbursementWorker(this.wallet);
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
  providers: [WalletService, DisbursementWorker, PaymentProviderService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
