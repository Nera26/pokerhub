# Accounting Guide

This document describes how PokerHub records wallet movements and keeps balances consistent.

## Ledger Schema

Two primary tables make up the ledger:

- **Account** – `{ id, userId, balance }`
- **JournalEntry** – `{ id, accountId, amount, refType, refId, providerTxnId?, providerStatus?, createdAt }`

Every business action writes equal and opposite `JournalEntry` rows so that the sum of `amount` per `refId` is zero.

### Example

| id | accountId | amount | refType | refId | createdAt |
|----|-----------|-------:|---------|-------|-----------|
| 1  | A1        |  +1000 | deposit | D1    | 2024-01-01T00:00:00Z |
| 2  | A1        |  -1000 | game    | H42   | 2024-01-02T00:00:00Z |
| 3  | A2        |  +1000 | game    | H42   | 2024-01-02T00:00:00Z |

## Reconciliation Procedure

1. Run `WalletService.reconcile()` which sums journal entries per account and compares them with the `balance` column.
2. The job `backend/src/wallet/reconcile.job.ts` executes nightly and writes a report to `storage/reconcile-YYYY-MM-DD.json`.
3. Any mismatched account causes the job to fail and alerts ops to investigate.

## 3-D Secure & Chargebacks

Deposits and withdrawals initiate a 3‑D Secure challenge with the payment provider before any journal entry is recorded. The resulting provider transaction id and final status are persisted on each `JournalEntry`.

Transactions flagged as `risky` are aborted. If the provider reports a `chargeback` after recording, the service writes reversing entries so that balances remain accurate.
