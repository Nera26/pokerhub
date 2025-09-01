# Feature Flags Runbook
<!-- Update service IDs in this file if PagerDuty services change -->

This runbook covers operational procedures for managing feature flags in PokerHub.

## Dashboard
- Metabase: [Feature Flags](../analytics-dashboards.md)

## PagerDuty Escalation
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->

## Listing Flags

```bash
curl https://api.pokerhub.local/feature-flags
```

## Enabling or Disabling a Flag

```bash
# enable dealing
curl -X PUT https://api.pokerhub.local/feature-flags/dealing \
  -H 'Content-Type: application/json' \
  -d '{"value": true}'

# disable settlement
curl -X PUT https://api.pokerhub.local/feature-flags/settlement \
  -H 'Content-Type: application/json' \
  -d '{"value": false}'
```

## Removing a Flag

```bash
curl -X DELETE https://api.pokerhub.local/feature-flags/dealing
```

### Scoped Flags

```bash
# disable dealing on a specific table
curl -X PUT https://api.pokerhub.local/feature-flags/room/TABLE_ID/dealing \
  -H 'Content-Type: application/json' \
  -d '{"value": false}'

# disable settlement for a specific tournament
curl -X PUT https://api.pokerhub.local/feature-flags/tourney/TOURNEY_ID/settlement \
  -H 'Content-Type: application/json' \
  -d '{"value": false}'

# remove a room flag
curl -X DELETE https://api.pokerhub.local/feature-flags/room/TABLE_ID/dealing
```

## Frontend Cache

Flags are cached in the browser's `localStorage`. When updating flags,
advise users to refresh the page to pick up the new values.
