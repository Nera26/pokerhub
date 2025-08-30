# Tournament Handbook

## Tournament Formats

- **Freezeout** – players are eliminated when their chips reach zero.
- **Rebuy** – busted players may purchase another stack during the rebuy period.
- **Bounty** – a portion of each buy‑in is placed on every player's head and paid to whoever knocks them out.
- **Shootout** – tables play down to a single winner before reseating for the next round.

## Payout Rules

PokerHub awards prizes to roughly the top 15% of entrants. Final table payouts follow a smooth curve so that each position is worth more than the next. When deals are discussed, all remaining players must agree and the resulting payouts must at least match ICM equity.

## Bubble Elimination

When multiple players bust on the same hand where fewer prizes remain than
players involved, the prize amounts for the affected positions are combined
and split equally. Any odd chips are awarded to the players who began the hand
with the largest stacks.

### Example

If three players are eliminated while two payouts remain worth 100 and 50
chips, they each receive 50 chips. The leftover chip goes to the player who
had the biggest stack before the hand.

## ICM Payouts

Independent Chip Model (ICM) is used to estimate each player's equity based on
remaining chip stacks and the payout structure. The model recursively assigns
probabilities for every finishing position and converts fractional results to
integer chips, distributing any rounding remainder to the highest equities.

### Example

Stacks: `[5000, 3000, 2000]`

Prizes: `[50, 30, 20]`

ICM Payouts: `[50, 30, 20]` (sums exactly to the prize pool)

All rounding errors are less than one chip.

## Blind Structure Simulation

A Monte Carlo simulation with 10,000 entrants tested a standard blind structure of 100 five‑minute levels and three bot profiles (tight, loose, aggressive). Across 100 runs the average tournament duration was about 130 minutes. Prize distribution variance was dominated by tight bots (~2.48e9) while loose and aggressive profiles rarely cashed.

```json
{
  "name": "standard",
  "levels": 100,
  "levelMinutes": 5,
  "increment": 0.05,
  "expectedDuration": 130
}
```

## Dispute Resolution

1. Players must pause the clock and call for a tournament director.
2. The director reviews hand histories, betting logs and applicable rules.
3. A ruling is announced to the table and recorded for the event log.
4. Appeals can be filed with operations within 24 hours for post‑event review.

## See Also
- [Game Engine Spec](../game-engine-spec.md)
- [Tournament Balancing Backlog Runbook](../runbooks/tourney-balancing-backlog.md)

## Revision History
- 7cbff0e: parameterize tournament simulator and validate structures
- c643a4f: add bot profiles to tournament simulator
- 8bfce13: add tournament simulator and handbook
- 2025-08-30: document formats, payout rules and dispute process
- 2025-01-04: append revision history
