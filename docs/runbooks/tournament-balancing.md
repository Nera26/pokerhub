# Tournament Balancing

Players should not be reseated repeatedly during short stretches of play.

## Recently Moved Rule

- Skip players who were moved within the last `TOURNAMENT_AVOID_WITHIN` hands.
- Applies across successive rebalance cycles to prevent ping‑pong moves.

## Verification

- Covered by integration test [`backend/src/tournament/table-balancer.integration.spec.ts`](../../backend/src/tournament/table-balancer.integration.spec.ts).

## See Also

- [Tourney Balancing Backlog Runbook](./tourney-balancing-backlog.md)
