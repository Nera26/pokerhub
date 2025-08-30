# Error Rates

Responding to elevated application error rates.

## Dashboard
- Grafana: [Error Rates](../../infrastructure/monitoring/grafana-error-rates.json)
- Metabase: [Error Rate](../analytics-dashboards.md#error-rate-1)

## PagerDuty Escalation
- Service: `pokerhub-sre`

## When to page
Page when sustained error budget burn exceeds limits described in [SLO error-budget handling](../SLOs.md#error-budget-handling).

## Triage
1. Confirm which services are returning errors.
2. Review recent deploys and logs for stack traces.

## Mitigation
- Roll back problematic deployments.
- Engage service owners for persistent issues.
