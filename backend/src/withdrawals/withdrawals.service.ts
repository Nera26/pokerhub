import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WithdrawalDecision } from './withdrawal-decision.entity';
import { WalletService } from '../wallet/wallet.service';
import { Disbursement } from '../wallet/disbursement.entity';
import { Account } from '../wallet/account.entity';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(WithdrawalDecision)
    private readonly decisions: Repository<WithdrawalDecision>,
    @InjectRepository(Disbursement)
    private readonly disbursements: Repository<Disbursement>,
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
    private readonly wallet: WalletService,
  ) {}

  async approve(userId: string, reviewerId: string, comment: string) {
    await this.decisions.save({
      userId,
      reviewerId,
      comment,
      status: 'approved',
    });
    const disb = await this.disbursements.findOne({
      where: { accountId: userId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    if (disb) {
      const account = await this.accounts.findOneByOrFail({ id: userId });
      await this.wallet.requestDisbursement(disb.id, account.currency);
    }
  }

  async reject(userId: string, reviewerId: string, comment: string) {
    await this.decisions.save({
      userId,
      reviewerId,
      comment,
      status: 'rejected',
    });
    const disb = await this.disbursements.findOne({
      where: { accountId: userId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    if (disb) {
      await this.wallet.refundDisbursement(disb);
      await this.disbursements.delete(disb.id);
    }
  }
}

