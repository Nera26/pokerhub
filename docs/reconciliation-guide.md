# Reconciliation Guide

**Version:** 1.0.0  
**Last Updated:** 2025-08-30

This guide explains how wallet ledgers stay consistent and how disputes are resolved.

## Ledger Reconciliation

1. Export all `JournalEntry` rows for the period and sort by account and timestamp.
2. Compute a running balance per account using debits and credits.
3. Compare the computed balance with the `accounts.balance` column.
4. Cross‑check totals against payment provider statements.
5. Generate a daily report highlighting any deltas and archive it.
6. Investigate mismatches immediately; no gambling funds are released until resolved.

## Buy-ins and Payouts

Tournament buy-ins debit the player's account and credit the event pool. When a
game completes, payouts reverse the flow, debiting the pool and crediting each
winner. Reconciliation confirms that the sum of payouts plus rake equals the
total buy-ins for the event.

### Flow

```mermaid
flowchart TD
  A[Export Journal Entries] --> B[Compute Balances]
  B --> C[Compare to Accounts]
  C --> D[Cross-check Provider]
  D --> E[Generate Report]
  E --> F{Discrepancy?}
  F -->|Yes| G[Investigate]
  F -->|No| H[Archive]
```

### Example Reconciliation Run

| entryId | account        | debit | credit | runningBalance |
|--------:|---------------|------:|-------:|---------------:|
| 10      | player:alice   | 100   | 0      | 100 |
| 11      | cash:house     | 0     | 100    |   0 |
| 12      | player:alice   | 0     | 50     |  50 |
| 13      | cash:house     | 50    | 0      |  50 |

From these entries the computed balance for `player:alice` is `$50`. If the
`accounts.balance` column stores `$60`, the reconciliation report records a `$10`
delta and flags the account for investigation.

## Failure Scenarios

| Scenario | Detection | Resolution |
|---------|-----------|------------|
| Missing journal entry | Running balance differs from provider report | Insert corrective entry and document root cause. |
| Double debit/credit | Duplicate reference IDs in `JournalEntry` | Reverse duplicate and alert engineering. |
| Provider outage | API reconciliation fails | Pause withdrawals and retry reconciliation when service restores. |
| Crash mid‑reconciliation | Report generation incomplete | Rerun reconciliation from last successful checkpoint. |

### Example Mismatch

Deposit provider reports $50, but journal shows $40 credit. Create a $10 corrective entry and note the discrepancy.

## Dispute Workflow

1. **Intake** – Support logs a ticket with account id, timeframe, and evidence.
2. **Triaging** – Operations replays journal entries and verifies provider transactions.
3. **Resolution** – If ledger is correct, communicate findings; otherwise write correcting entries.
4. **Escalation** – Unresolved cases escalate to compliance for regulatory reporting.

## Audit Trail

- All reconciliation runs and dispute outcomes are archived under `storage/` with immutable timestamps.
- Reports include the job run identifier and a SHA-256 checksum for tamper evidence.
- A typical record in `storage/reconcile-2025-08-30.json`:

```json
{
  "accountId": "player:alice",
  "expected": 60,
  "computed": 50,
  "delta": -10,
  "checksum": "9d2c...",
  "runId": "2025-08-30T00:00:00Z"
}
```

- Reports older than one year move to cold storage but remain retrievable for regulators.

## Revision History
- 2025-08-30: add reconciliation run example, audit trail details, flow diagram, example mismatch, and version metadata
- 2025-08-30: cover buy-ins and payouts reconciliation

