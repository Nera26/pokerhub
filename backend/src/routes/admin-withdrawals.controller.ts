import { Controller } from '@nestjs/common';
import type { Request } from 'express';
import AdminTransactionsBase from './admin-transactions.base';
import { WalletService } from '../wallet/wallet.service';
import {
  PendingWithdrawalsResponseSchema,
  WithdrawalDecisionRequestSchema,
  type WithdrawalDecisionRequest,
} from '../schemas/withdrawals';

@Controller('admin/withdrawals')
export default class AdminWithdrawalsController extends AdminTransactionsBase {
  constructor(private readonly wallet: WalletService) {
    super();
  }

  protected async listPending() {
    const withdrawals = await this.wallet.listPendingWithdrawals();
    return PendingWithdrawalsResponseSchema.parse({ withdrawals });
  }

  protected confirmPending(id: string, req: Request) {
    return this.wallet.confirmPendingWithdrawal(id, req.userId ?? 'admin');
  }

  protected async rejectPending(
    id: string,
    body: WithdrawalDecisionRequest,
    req: Request,
  ) {
    const parsed = WithdrawalDecisionRequestSchema.parse(body);
    await this.wallet.rejectPendingWithdrawal(
      id,
      req.userId ?? 'admin',
      parsed.comment,
    );
  }
}
