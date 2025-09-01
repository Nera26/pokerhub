# Leaderboard Ratings

The leaderboard uses a volatility adjusted rating system derived from an
exponentially weighted moving average of session points. Each session contributes
`points × decay^ageDays` where older games are discounted by the configured
`decay` factor.

## Variable K‑factor

The traditional constant K‑factor is replaced with a dynamic value that scales
with both player volatility and experience:

- **Sessions played** – players with few sessions receive only a fraction of the
  base K to discourage rating farming. The factor ramps up until the player
  reaches the configured minimum session count.
- **Volatility** – the system tracks the average absolute deviation of each
  player's performance. High volatility increases the effective K so ratings can
  react faster to hot or cold streaks.

This mechanism keeps long‑term grinders stable while allowing legitimately
swingy players to move on the leaderboard more quickly.

## Anti‑farm rationale

Because K is dampened for newcomers, playing a handful of high scoring sessions
no longer results in outsized leaderboard positions. Players must log a minimum
number of sessions before their results carry full weight, making it costly to
create disposable accounts for rating boosts.

See `backend/src/leaderboard/rating.ts` for implementation details.

Property-based tests under `backend/test/leaderboard` exercise these behaviors
to guard against regressions.

