# Orphaned Reservation Runbook

Use this guide when seat reservations are not released after players disconnect.

## Detection
- Seats remain reserved after players disconnect.
- Reservation TTL metrics exceed thresholds in Grafana.
- Support tickets from users unable to join tables.

## Mitigation Steps
1. Locate the reservation in Redis with `scripts/reservation-find.sh <playerId>`.
2. Manually release or expire the reservation using `redis-cli`.
3. Ask the player to reconnect and confirm the seat status.
4. If several reservations are affected, restart the reservation service with `pm2 restart reservation`.
5. Log the incident and follow up with impacted players.

## Verification
- Ensure the seat appears free in the lobby.
- Monitor for reoccurrence over the next hour.

## Escalation
- PagerDuty: pokerhub-eng
- Slack: #ops
