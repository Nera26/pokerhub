# Orphaned Reservation Runbook

Guidance for clearing reservations that were never released.

## Symptoms
- Seats remain reserved after players disconnect.
- Reservation TTLs exceed expected thresholds.

## Steps
1. Locate reservation in Redis using the player ID.
2. Manually release or expire the reservation.
3. Notify the player to reconnect and verify seat status.

## Escalation
- PagerDuty: pokerhub-eng
- Slack: #ops
