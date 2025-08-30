# Wallet Reconciliation Guide

This guide shows how to verify wallet balances against the immutable ledger.

## Ledger Overview
- `Account` rows store the canonical balance for each user wallet.
- `JournalEntry` records every debit and credit with `{ accountId, amount, refType, refId }`.
- For any reference, the sum of its debits and credits must equal zero.

## Proof Generation
The reconciliation job rebuilds balances from the journal and compares them to stored accounts:

1. Aggregate journal totals per account.
2. Diff against the `Account.balance` table.
3. Emit a JSON report listing any mismatches.

## CLI Tooling
Run the job manually to produce proofs:

```bash
npx ts-node backend/src/wallet/reconcile.job.ts > storage/reconcile-manual.json
```

The report contains an array of discrepancies; an empty array proves all accounts match their journal.

## Interpreting Reports
- `[]` – ledger and balances agree.
- `[ { accountId, expected, actual } ]` – a mismatch exists and requires investigation.
- Reports are retained under `storage/` for audit trails.

## Revision History
- 2025-01-04: initial version
