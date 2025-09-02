# Leaderboard Ratings

The leaderboard now uses a [Glicko-2](https://www.glicko.net/glicko.html)
rating system. Each session updates a player's rating, rating deviation (RD)
and volatility based on the match result. Older sessions naturally increase RD
until the player competes again.

## Variable K‑factor

Glicko-2 exposes RD and volatility directly, allowing swingy players to move
on the leaderboard more quickly while long-term grinders remain stable.

## Anti‑farm rationale

Players must still meet a minimum number of sessions before being ranked,
discouraging rating farming with disposable accounts.

See `backend/src/leaderboard/rating.ts` for implementation details.

Property-based tests under `backend/test/leaderboard` exercise these behaviors
to guard against regressions.

