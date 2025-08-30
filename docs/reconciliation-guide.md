# Reconciliation Guide

This guide explains how wallet ledgers stay consistent and how disputes are resolved.

## Ledger Reconciliation

1. Aggregate `JournalEntry` rows by account.
2. Compare the sum with the stored `balance` column.
3. Generate a daily report highlighting any deltas.
4. Investigate mismatches immediately; no gambling funds are released until resolved.

## Dispute Workflow

1. **Intake** – Support logs a ticket with account id, timeframe, and evidence.
2. **Triaging** – Operations replays journal entries and verifies provider transactions.
3. **Resolution** – If ledger is correct, communicate findings; otherwise write correcting entries.
4. **Escalation** – Unresolved cases escalate to compliance for regulatory reporting.

## Audit Trail

- All reconciliation runs and dispute outcomes are archived under `storage/` with immutable timestamps.
- Reports older than one year move to cold storage but remain retrievable for regulators.

