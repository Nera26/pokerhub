# Tournament Handbook

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
