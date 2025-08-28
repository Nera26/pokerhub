# Accounting Book

## Ledger Schema
- **Account**: tracks the running balance for a wallet participant.
- **JournalEntry**: immutable rows recording debits and credits with a `refType` and `refId`.
- Every transaction writes equal and opposite entries so the sum of amounts per ref is zero.

## Reconciliation Procedure
1. `WalletService.reconcile()` aggregates journal totals per account and compares them with stored balances.
2. The reconciliation job (`backend/src/wallet/reconcile.job.ts`) runs daily at midnight UTC.
3. Each run writes a JSON report under `storage/` named `reconcile-YYYY-MM-DD.json`.
4. If any account mismatches are detected the job throws, causing CI to fail.

## Ledger Integrity Tests
- Property-based test (`backend/test/wallet/reconcile.sum.property.spec.ts`) generates random transaction batches.
- For each batch `WalletService.reconcile()` must return no discrepancies and the totals must sum to zero.
- Any failing case writes the offending batch and report to `storage/wallet-reconcile-failure.json` and fails CI, ensuring ledger integrity.
