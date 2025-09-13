import { WalletService } from '../../src/wallet/wallet.service';
import { Account } from '../../src/wallet/account.entity';

export interface Accounts {
  user: Account;
  reserve: Account;
  house: Account;
  rake: Account;
  prize: Account;
}

export type Operation =
  | { type: 'deposit'; amount: number; ref: string }
  | { type: 'withdraw'; amount: number; ref: string }
  | {
      type: 'reserve' | 'reserveCommit';
      amount: number;
      rake: number;
      ref: string;
      idempotencyKey: string;
    }
  | {
      type: 'reserveRollback';
      amount: number;
      ref: string;
      idempotencyKey: string;
    };

export async function applyOperation(
  service: WalletService,
  accounts: Accounts,
  userId: string,
  op: Operation,
): Promise<void> {
  switch (op.type) {
    case 'deposit':
      await (service as any).record('deposit', op.ref, [
        { account: accounts.house, amount: -op.amount },
        { account: accounts.user, amount: op.amount },
      ]);
      break;
    case 'withdraw':
      await (service as any).record('withdraw', op.ref, [
        { account: accounts.user, amount: -op.amount },
        { account: accounts.house, amount: op.amount },
      ]);
      break;
    case 'reserve':
    case 'reserveCommit':
      await service.reserve(userId, op.amount, op.ref, 'USD', op.idempotencyKey);
      await service.commit(op.ref, op.amount, op.rake, 'USD', op.idempotencyKey);
      break;
    case 'reserveRollback':
      await service.reserve(userId, op.amount, op.ref, 'USD', op.idempotencyKey);
      await service.rollback(userId, op.amount, op.ref, 'USD');
      break;
    default:
      const _exhaustive: never = op;
      return _exhaustive;
  }
}
