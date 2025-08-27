import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { JournalEntry } from './journal-entry.entity';
import { WalletService } from './wallet.service';
import { WalletController } from '../routes/wallet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Account, JournalEntry])],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
