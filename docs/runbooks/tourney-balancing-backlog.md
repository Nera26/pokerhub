# Tourney Balancing Backlog Runbook

Resolve backlogs in the tournament balancer to keep seating timely and fair.

## Detection
- `tourneyBalanceLag` metric exceeds 30 s.
- Balancer dashboard shows >100 pending seats.
- Support reports players waiting for new tables.

## Mitigation Steps
1. Check balancer worker logs for crashes or stalled jobs.
2. Scale balancer workers or restart with `pm2 restart tourney-balancer`.
3. For individual events, run `scripts/tourney-balance-run.sh <tourneyId>`.
4. If backlog persists, pause new registrations with `scripts/tourney-signup-pause.sh`.

## Verification
- Queue depth returns to normal levels.
- Players seated within 10 s over the next 5 m.

## Escalation
- PagerDuty: pokerhub-eng
- Slack: #ops

## Drill
- Exercised via monthly chaos drill (`.github/workflows/chaos-drill.yml`).
