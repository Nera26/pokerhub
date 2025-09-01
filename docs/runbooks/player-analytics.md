# Player Analytics

Handle anomalies in player engagement metrics such as DAU, MAU, and registration→deposit conversion.

## Dashboard
- Grafana: [Player Analytics](../../infra/observability/player-analytics-dashboard.json)

## PagerDuty
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->
- Escalation: [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456)

## Metrics
- **DAU** – count of distinct `auth.login` user IDs in the previous UTC day.
- **MAU** – count of distinct `auth.login` user IDs over the trailing 30 days.
- **Reg→Dep Conversion** – percentage of new logins that made a `wallet.credit` with `refType=deposit` the same day.

## Playbook
1. Verify ClickHouse ingestion jobs are healthy.
2. Check `engagement_metrics` for the affected date and inspect corresponding `storage/events/engagement-YYYY-MM-DD.json`.
3. Re-run `AnalyticsService.rebuildEngagementMetrics()` via Nest CLI for the missing day.
4. If ClickHouse is unavailable, ensure Redis streams `analytics:auth.login` and `analytics:wallet.credit` have recent entries.
5. Escalate to data engineering if metrics remain inconsistent.

Refer to [Error Budget Procedures](../error-budget-procedures.md) if data gaps impact SLOs.
