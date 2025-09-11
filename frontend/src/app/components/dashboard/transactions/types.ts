import type { PendingDeposit } from '@shared/wallet.schema';
import { TransactionLogResponseSchema } from '@shared/transactions.schema';
import { z } from 'zod';

export type StatusBadge = PendingDeposit['status'];

export type Txn = z.infer<typeof TransactionLogResponseSchema>[number];
