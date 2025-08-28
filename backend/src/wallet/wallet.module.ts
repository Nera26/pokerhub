import { Module, Injectable, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { Disbursement } from './disbursement.entity';
import { WalletService } from './wallet.service';
import { WalletController } from '../routes/wallet.controller';
import { EventsModule } from '../events/events.module';
import { RedisModule } from '../redis/redis.module';
import { startDisbursementWorker } from './disbursement.worker';

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
    TypeOrmModule.forFeature([Account, JournalEntry, Disbursement]),
    EventsModule,
    RedisModule,
  ],
  providers: [WalletService, DisbursementWorker],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
