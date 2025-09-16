import AdminPendingTransactionsController from './admin-pending.controller';
import {
  WithdrawalDecisionRequestSchema,
  type WithdrawalDecisionRequest,
} from '../schemas/withdrawals';
import {
  PendingWithdrawalsResponseSchema,
  type PendingWithdrawalsResponse,
} from '@shared/types';
import type { WalletService } from '../wallet/wallet.service';
import type { Request } from 'express';

export default AdminPendingTransactionsController({
  path: 'admin/withdrawals',
  response: PendingWithdrawalsResponseSchema,
  request: WithdrawalDecisionRequestSchema,
  async list(wallet: WalletService): Promise<PendingWithdrawalsResponse> {
    const withdrawals = await wallet.listPendingWithdrawals();
    return { withdrawals };
  },
  confirm(wallet: WalletService, id: string, req: Request) {
    return wallet.confirmPendingWithdrawal(id, req.userId ?? 'admin');
  },
  reject(
    wallet: WalletService,
    id: string,
    body: WithdrawalDecisionRequest,
    req: Request,
  ) {
    return wallet.rejectPendingWithdrawal(
      id,
      req.userId ?? 'admin',
      body.comment,
    );
  },
});

