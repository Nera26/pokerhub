# Orphaned Reservation Runbook
<!-- Update service IDs in this file if PagerDuty services change -->

Use this guide when seat reservations are not released after players disconnect.

## Dashboard
- Grafana: [Reservations](../analytics-dashboards.md)

## Detection
- Seats remain reserved after players disconnect.
- Reservation TTL metrics exceed thresholds in Grafana.
- Support tickets from users unable to join tables.
- Redis keys show `ttl=-1` for `reservation:*` entries.

## Mitigation Steps
1. Ensure `REDIS_URL` points to the target Redis instance, then locate the reservation key using `redis-cli`.
2. Release the reservation with `scripts/reservation-release.sh <playerId>` or manually via `redis-cli`.
3. Ask the player to reconnect and confirm the seat status.
4. If several reservations are affected, restart the reservation service with `pm2 restart reservation`.
5. Log the incident and follow up with impacted players.

## Verification
- Ensure the seat appears free in the lobby.
- Monitor for reoccurrence over the next hour.
- Confirm `reservationTTL` metrics return to baseline.

## PagerDuty Escalation
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->
- Slack: #ops

## Drill

Simulate orphaned reservations with the chaos script:

```sh
RESERVATIONS=5 node load/chaos/reservation-stall.js
```

The script logs each hand ID and the `redis-cli del` command required to clean
up. Remove the printed keys after validating recovery.
