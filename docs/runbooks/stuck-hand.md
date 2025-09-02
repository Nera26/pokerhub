# Stuck Hand Runbook
<!-- Update service IDs in this file if PagerDuty services change -->

When a hand fails to advance to the next state, use this guide to restore normal play.

## Dashboard
- Grafana: [Stuck Hand](../analytics-dashboards.md)

## Detection
- Hand timer exceeds expected duration.
- Players report a frozen or unresponsive table.
- `handTimeout` metrics in Grafana breach 2 m threshold.
- Room-worker logs show repeated `stalled-hand` warnings for the same table.

## Mitigation Steps
1. Inspect hand state via `scripts/hand-inspect.sh <handId>`.
2. If a corrupt state is found, restart the hand worker with `pm2 restart hand-worker`.
3. If timers remain stalled, run `scripts/hand-clear-lock.sh <handId>` followed by `scripts/hand-unblock.sh <handId>`.
4. Refund affected players and append a note in the incident tracker.
5. Document the hand ID and outcome in the postmortem tracker.

## Regional Failover Test
1. Launch two Redis instances to simulate primary and follower regions.
2. Bridge the `room:*:actions` channel from the primary Redis to the follower.
3. Run `npm test --prefix backend test/game/failover.spec.ts` to crash the primary worker.
4. Ensure the follower emits `failover` and advances the hand within the 30 m RTO. Escalate if promotion exceeds the target.

## Verification
- Confirm the worker resumes processing new hands.
- Monitor the table for one full orbit to ensure timers fire correctly.
- Check `handAdvanceDuration` metric returns to baseline in Grafana.

## PagerDuty Escalation
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->
- Slack: #ops

## Drill
- Covered by monthly chaos drill (`load/chaos/k6-latency.js`).
