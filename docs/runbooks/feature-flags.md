# Feature Flags Runbook

This runbook covers operational procedures for managing feature flags in PokerHub.

## Dashboard
- Metabase: [Feature Flags](../analytics-dashboards.md)

## PagerDuty Escalation
- Service: `pokerhub-eng`

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

## Frontend Cache

Flags are cached in the browser's `localStorage`. When updating flags,
advise users to refresh the page to pick up the new values.
