import AdminPendingTransactionsController from './admin-pending.controller';
import {
  PendingDepositsResponseSchema,
  DepositDecisionRequestSchema,
  type DepositDecisionRequest,
} from '@shared/wallet.schema';
import type { WalletService } from '../wallet/wallet.service';
import type { Request } from 'express';

export default AdminPendingTransactionsController({
  path: 'admin/deposits',
  response: PendingDepositsResponseSchema,
  request: DepositDecisionRequestSchema,
  async list(wallet: WalletService) {
    const deposits = await wallet.listPendingDeposits();
    return { deposits };
  },
  confirm(wallet: WalletService, id: string, req: Request) {
    return wallet.confirmPendingDeposit(id, req.userId ?? 'admin');
  },
  reject(
    wallet: WalletService,
    id: string,
    body: DepositDecisionRequest,
    req: Request,
  ) {
    return wallet.rejectPendingDeposit(id, req.userId ?? 'admin', body.reason);
  },
});

