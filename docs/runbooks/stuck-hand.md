# Stuck Hand Runbook

When a hand fails to advance to the next state, use this guide to restore normal play.

## Detection
- Hand timer exceeds expected duration.
- Players report a frozen or unresponsive table.
- `handTimeout` metrics in Grafana breach 2 m threshold.

## Mitigation Steps
1. Inspect hand state via `scripts/hand-inspect.sh <handId>`.
2. If a corrupt state is found, restart the hand worker with `pm2 restart hand-worker`.
3. If timers remain stalled, run `scripts/hand-unblock.sh <handId>` to force progression.
4. Refund affected players and append a note in the incident tracker.
5. Document the hand ID and outcome in the postmortem tracker.

## Verification
- Confirm the worker resumes processing new hands.
- Monitor the table for one full orbit to ensure timers fire correctly.

## Escalation
- PagerDuty: pokerhub-eng
- Slack: #ops

## Drill
- Covered by monthly chaos drill (`load/chaos/k6-latency.js`).
