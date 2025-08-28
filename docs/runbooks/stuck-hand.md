# Stuck Hand Runbook

When a game hand fails to progress, follow this guide to resolve the incident.

## Symptoms
- Hand timer exceeds expected duration.
- Players report frozen or unresponsive table.

## Steps
1. Inspect hand state via `scripts/hand-inspect.sh`.
2. If state is corrupt, restart the hand worker.
3. Refund affected players and notify support.

## Escalation
- PagerDuty: pokerhub-eng
- Slack: #ops
