import type { PendingDeposit } from '@shared/wallet.schema';
import type { TransactionLogEntry } from '@shared/transactions.schema';

export type StatusBadge = PendingDeposit['status'];

export type Txn = TransactionLogEntry;
