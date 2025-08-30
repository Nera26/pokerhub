# Leaderboard Rebuild

The leaderboard is rebuilt automatically every 24h but can also be triggered manually.

## Dashboard
- Metabase: [Leaderboard](../analytics-dashboards.md)

## PagerDuty Escalation
- Service: `pokerhub-eng`

## CLI

Run the rebuild script from the backend package:

```bash
npm run --workspace backend rebuild:leaderboard [days]
```

`days` is optional (defaults to `30`) and limits how far back analytics data is considered. A full rebuild for the default range completes in under a minute.

## API

Admins can trigger a rebuild via HTTP:

```bash
curl -X POST "<api>/leaderboard/rebuild?days=30"
```

The endpoint responds with `202 Accepted` immediately while the rebuild continues in the background.
