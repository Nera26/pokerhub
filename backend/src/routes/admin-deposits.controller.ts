import { Controller } from '@nestjs/common';
import type { Request } from 'express';
import AdminTransactionsBase from './admin-transactions.base';
import { WalletService } from '../wallet/wallet.service';
import {
  PendingDepositsResponseSchema,
  DepositDecisionRequestSchema,
  type DepositDecisionRequest,
} from '@shared/wallet.schema';

@Controller('admin/deposits')
export default class AdminDepositsController extends AdminTransactionsBase {
  constructor(private readonly wallet: WalletService) {
    super();
  }

  protected async listPending() {
    const deposits = await this.wallet.listPendingDeposits();
    return PendingDepositsResponseSchema.parse({ deposits });
  }

  protected confirmPending(id: string, req: Request) {
    return this.wallet.confirmPendingDeposit(id, req.userId ?? 'admin');
  }

  protected async rejectPending(
    id: string,
    body: DepositDecisionRequest,
    req: Request,
  ) {
    const parsed = DepositDecisionRequestSchema.parse(body);
    await this.wallet.rejectPendingDeposit(
      id,
      req.userId ?? 'admin',
      parsed.reason,
    );
  }
}
