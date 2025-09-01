import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalDecision } from './withdrawal-decision.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Disbursement } from '../wallet/disbursement.entity';
import { Account } from '../wallet/account.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WithdrawalDecision, Disbursement, Account]),
    WalletModule,
    AuthModule,
  ],
  providers: [WithdrawalsService],
  controllers: [WithdrawalsController],
})
export class WithdrawalsModule {}

