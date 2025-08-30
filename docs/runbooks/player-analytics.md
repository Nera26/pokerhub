# Player Analytics

Handle anomalies in player engagement metrics such as DAU, MAU, and rake trends.

## Dashboard
- Grafana: [Player Analytics](../../infrastructure/observability/player-analytics-dashboard.json)

## PagerDuty Escalation
- Service: `pokerhub-eng`

## Triage
1. Verify ClickHouse ingestion jobs are healthy.
2. Re-run analytics ETL for missing data.
3. Escalate to data engineering if metrics remain inconsistent.
