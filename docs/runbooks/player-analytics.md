# Player Analytics

Handle anomalies in player engagement metrics such as DAU, MAU, and rake trends.

## Dashboard
- Grafana: [Player Analytics](../../infrastructure/observability/player-analytics-dashboard.json)

## PagerDuty
- Service: `pokerhub-eng` (ID: PENG456)
- Escalation: [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456)

## Playbook
1. Verify ClickHouse ingestion jobs are healthy.
2. Re-run analytics ETL for missing data.
3. Escalate to data engineering if metrics remain inconsistent.

Refer to [Error Budget Procedures](../error-budget-procedures.md) if data gaps impact SLOs.
