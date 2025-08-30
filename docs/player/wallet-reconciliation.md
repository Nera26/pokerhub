# Wallet Reconciliation Guide

**Version:** 1.0.0
**Last Updated:** 2025-08-30

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

## Reconciliation Procedure

1. Export all `JournalEntry` rows for the period under review.
2. Run the reconciliation job to rebuild balances from those entries.
3. For each mismatch, trace the offending `refType`/`refId` to the originating system.
4. Post adjusting journal entries if a debit or credit was missed.
5. Rerun the job to confirm the discrepancy is cleared.

### Example

If the report shows `{ accountId: 42, expected: 5000, actual: 4500 }`, query the journal for account 42. Suppose a `DEPOSIT` entry for 500 chips was never written. Inserting the missing entry brings the balance back to 5000 and the reconciliation job returns an empty array.

## See Also
- [Accounting Spec](../accounting.md)
- [Wallet Reconciliation Runbook](../runbooks/wallet-reconciliation.md)

## Revision History
- 2025-08-30: add step-by-step procedure, example, and version metadata
- 2025-01-04: initial version
