# Tournament Handbook

**Version:** 1.1.1
**Last Updated:** 2025-09-05
**Changelog:** [CHANGELOG](./handbook/CHANGELOG.md)

This handbook standardizes how PokerHub hosts competitive events. Engine
behavior is detailed in the [Game Engine Specification](./game-engine-spec.md),
and ledger procedures reside in the [Reconciliation Guide](./reconciliation-guide.md).

Tournament logic is implemented in [`backend/src/tournament`](../backend/src/tournament)
with event ingestion defined in [`infrastructure/analytics/ingest-tournament.sql`](../infrastructure/analytics/ingest-tournament.sql).

## Lifecycle

```mermaid
flowchart LR
  Register --> "Late Reg Ends" --> Play --> "Final Table" --> Payouts
```

## Formats

- **Freezeout** – One life per player; re‑entries are not permitted.
- **Rebuy/Add‑On** – Chips can be repurchased until a fixed level; an optional add‑on is offered at the first break.
- **Progressive Knockout** – Half the buy‑in funds a bounty that increases as players collect others' bounties.
- **Satellite** – Payouts are tickets to target events; extra chips above the bubble are paid as cash.
- **Shootout** – Tables play down to one winner who advances to the next round or final table.

## Blinds

- Starting stacks target 100 big blinds unless noted.
- Levels increase on a schedule (e.g., every 10 minutes for standard, 5 minutes for turbo).
- Antes are introduced when blinds reach 200/400.

| Level | Blinds | Duration |
|------:|-------:|---------:|
| 1 | 100/200 | 10m |
| 2 | 200/400 | 10m |
| 3 | 300/600 | 10m |
| 4 | 400/800 | 10m |

## Payout Rules

- Prize pool equals `(entries × buy‑in) − rake` unless a guarantee exceeds it.
- Payout tables are published before start and locked once registration closes.
- Standard tables pay ~15% of the field using a top‑heavy distribution and round to the nearest chip.
- Bounty events return half of the buy‑in as knock‑out rewards.
- Guarantees short on entries are made whole by the house.

## Examples

### 10‑Player Freezeout

| Place | Payout % | Amount (100 buy‑in) |
|------:|---------:|--------------------:|
| 1     | 50%      | $500 |
| 2     | 30%      | $300 |
| 3     | 20%      | $200 |

### 8‑Player Progressive KO

- Buy‑in: $100 (50 prize / 50 bounty)
- Prize pool: $400

| Place | Prize | Bounty Earned |
|------:|------:|---------------:|
| 1     | $200  | accumulates 8×$50 |
| 2     | $120  | accumulates remaining bounties |
| 3     | $80   | -- |

## Reconciliation

Tournament ledger entries must be verified daily. Follow the [reconciliation procedure](./accounting-book.md#reconciliation-procedure) to confirm balances.

## Changelog
- **1.1.0** – 2025-08-30 – Added cross-references to engine spec and reconciliation guide; converted revision history to changelog.
- **1.0.1** – 2025-08-30 – Added lifecycle diagram and version metadata.
- **1.0.0** – 2025-01-04 – Initial tournament policies.

