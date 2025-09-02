# Accounting Guide

This document describes how PokerHub records wallet movements and keeps balances consistent.

## Bankroll Management

Player funds live in individual **Account** rows.  The sum of all player
accounts plus the house account represents total bankroll under custody.  Any
movement between accounts must net to zero to preserve bankroll integrity.

## Rake Policy

Cash games and tournaments charge a percentage fee that credits the house
account.  Rake is deducted from the pot before payouts and is capped per game
according to regulatory limits.

## Payout Logic

When a hand or tournament concludes:

1. Compute gross winnings per player.
2. Deduct rake and credit the house.
3. Credit each winner's account with their net amount.

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
2. The job `backend/src/wallet/reconcile.job.ts` runs daily at 00:00 UTC, scans prior-day hand and tournament logs, and writes a report to `storage/reconcile-YYYY-MM-DD.json`.
3. Any mismatched account or non‑zero log total causes the job to fail and emit a `wallet.reconcile.mismatch` alert for investigation.

## Local Ledger Audits

Property-based tests check that accounting invariants hold over random batches and that hand logs can be replayed deterministically.

```bash
# Ledger batches sum to zero and reconcile with logs
npm test --prefix backend -- src/wallet/wallet.ledger.property.spec.ts

# Hand-log replay consistency
npm test --prefix backend -- test/wallet/hand-logs.replay.property.spec.ts
```

Failures write details to `storage/reconcile-YYYY-MM-DD.json` for debugging.

## 3-D Secure & Chargebacks

Deposits and withdrawals initiate a 3‑D Secure challenge with the payment provider before any journal entry is recorded. The resulting provider transaction id and final status are persisted on each `JournalEntry`.

Transactions flagged as `risky` are aborted. If the provider reports a `chargeback` after recording, the service writes reversing entries so that balances remain accurate.

