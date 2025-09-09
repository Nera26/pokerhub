import { z } from 'zod';

export const CurrencySchema = z.string().length(3);

export const AmountSchema = z.object({
  amount: z.number().int().positive(),
  currency: CurrencySchema,
});

export type Amount = z.infer<typeof AmountSchema>;

export const AdminBalanceRequestSchema = z.object({
  action: z.enum(['add', 'remove', 'freeze']),
  amount: z.number().int().positive(),
  currency: CurrencySchema,
  notes: z.string().optional(),
});
export type AdminBalanceRequest = z.infer<typeof AdminBalanceRequestSchema>;

export const AmountDeviceSchema = z.object({
  amount: z.number().int().positive(),
  deviceId: z.string(),
  currency: CurrencySchema,
});

export type AmountDeviceRequest = z.infer<typeof AmountDeviceSchema>;

export const WithdrawSchema = AmountDeviceSchema;
export type WithdrawRequest = z.infer<typeof WithdrawSchema>;

export const DepositSchema = AmountDeviceSchema;
export type DepositRequest = z.infer<typeof DepositSchema>;

export const TxSchema = z.object({
  amount: z.number().int().positive(),
  tx: z.string(),
  currency: CurrencySchema,
  rake: z.number().int().nonnegative().optional(),
});

export type TxRequest = z.infer<typeof TxSchema>;

export const ProviderCallbackSchema = z.object({
  eventId: z.string(),
  idempotencyKey: z.string(),
  providerTxnId: z.string(),
  status: z.enum(['approved', 'risky', 'chargeback']),
});

export type ProviderCallback = z.infer<typeof ProviderCallbackSchema>;

export const WalletStatusSchema = z.object({
  kycVerified: z.boolean(),
  denialReason: z.string().optional(),
  realBalance: z.number(),
  creditBalance: z.number(),
  currency: CurrencySchema,
});

export type WalletStatusResponse = z.infer<typeof WalletStatusSchema>;

export const KycDenialResponseSchema = z.object({
  accountId: z.string(),
  reason: z.string().nullable(),
});

export type KycDenialResponse = z.infer<typeof KycDenialResponseSchema>;

export const WalletTransactionSchema = z.object({
  id: z.string(),
  type: z.string(),
  amount: z.number().int(),
  currency: CurrencySchema,
  status: z.string(),
  createdAt: z.string().datetime(),
});

export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;

export const WalletTransactionsResponseSchema = z.object({
  realBalance: z.number(),
  creditBalance: z.number(),
  transactions: z.array(WalletTransactionSchema),
});
export type WalletTransactionsResponse = z.infer<
  typeof WalletTransactionsResponseSchema
>;

export const PendingTransactionSchema = z.object({
  id: z.string(),
  type: z.string(),
  amount: z.number().int(),
  currency: CurrencySchema,
  status: z.string(),
  createdAt: z.string().datetime(),
});

export type PendingTransaction = z.infer<typeof PendingTransactionSchema>;

export const PendingTransactionsResponseSchema = z.object({
  realBalance: z.number(),
  creditBalance: z.number(),
  transactions: z.array(PendingTransactionSchema),
});
export type PendingTransactionsResponse = z.infer<
  typeof PendingTransactionsResponseSchema
>;

export const BankTransferDepositRequestSchema = z.object({
  amount: z.number().int().positive(),
  currency: CurrencySchema,
  deviceId: z.string(),
  ip: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
export type BankTransferDepositRequest = z.infer<
  typeof BankTransferDepositRequestSchema
>;

export const BankDetailsSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  routingCode: z.string(),
});
export type BankDetails = z.infer<typeof BankDetailsSchema>;

export const BankTransferDepositResponseSchema = z.object({
  reference: z.string(),
  bank: BankDetailsSchema,
});
export type BankTransferDepositResponse = z.infer<
  typeof BankTransferDepositResponseSchema
>;

export const PendingDepositSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number().int(),
  currency: CurrencySchema,
  reference: z.string(),
  status: z.enum(['pending', 'confirmed', 'rejected']),
  actionRequired: z.boolean(),
  expiresAt: z.string().datetime(),
  avatar: z.string(),
  method: z.string(),
  confirmedBy: z.string().optional(),
  confirmedAt: z.string().datetime().optional(),
  rejectedBy: z.string().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PendingDeposit = z.infer<typeof PendingDepositSchema>;

export const PendingDepositsResponseSchema = z.object({
  deposits: z.array(PendingDepositSchema),
});
export type PendingDepositsResponse = z.infer<
  typeof PendingDepositsResponseSchema
>;

export const DepositDecisionRequestSchema = z.object({
  reason: z.string().optional(),
});
export type DepositDecisionRequest = z.infer<
  typeof DepositDecisionRequestSchema
>;

export const BankReconciliationEntrySchema = z.object({
  reference: z.string(),
  amount: z.number().int().positive(),
});
export type BankReconciliationEntry = z.infer<
  typeof BankReconciliationEntrySchema
>;

export const BankReconciliationRequestSchema = z.object({
  entries: z.array(BankReconciliationEntrySchema),
});
export type BankReconciliationRequest = z.infer<
  typeof BankReconciliationRequestSchema
>;

export const WalletReconcileMismatchSchema = z.object({
  date: z.string(),
  total: z.number(),
});
export type WalletReconcileMismatch = z.infer<
  typeof WalletReconcileMismatchSchema
>;

export const WalletReconcileMismatchesResponseSchema = z.object({
  mismatches: z.array(WalletReconcileMismatchSchema),
});
export type WalletReconcileMismatchesResponse = z.infer<
  typeof WalletReconcileMismatchesResponseSchema
>;

export const IbanResponseSchema = z.object({
  iban: z.string(),
  masked: z.string(),
  holder: z.string(),
  instructions: z.string(),
  updatedBy: z.string(),
  updatedAt: z.string().datetime(),
});
export type IbanResponse = z.infer<typeof IbanResponseSchema>;

export const IbanHistoryEntrySchema = z.object({
  date: z.string(),
  oldIban: z.string(),
  newIban: z.string(),
  by: z.string(),
  notes: z.string(),
});
export type IbanHistoryEntry = z.infer<typeof IbanHistoryEntrySchema>;

export const IbanHistoryResponseSchema = z.object({
  history: z.array(IbanHistoryEntrySchema),
});
export type IbanHistoryResponse = z.infer<
  typeof IbanHistoryResponseSchema
>;

export const TransactionTabSchema = z.object({
  id: z.enum(['all', 'deposits', 'withdrawals', 'manual']),
  label: z.string(),
});
export type TransactionTab = z.infer<typeof TransactionTabSchema>;

export const TransactionTabsResponseSchema = z.array(TransactionTabSchema);
export type TransactionTabsResponse = z.infer<typeof TransactionTabsResponseSchema>;
