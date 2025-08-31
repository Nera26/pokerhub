# Error Rates

Responding to elevated application error rates.

## Dashboard
- Grafana: [Error Rates](../../infrastructure/observability/error-rates-dashboard.json)
- Metabase: [Error Rate](../analytics-dashboards.md#error-rate-1)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE789) <!-- Update ID if PagerDuty service changes -->
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Confirm which services are returning errors.
2. Review recent deploys and logs for stack traces.
3. Roll back problematic deployments.
4. Engage service owners for persistent issues.

Follow [Error Budget Procedures](../error-budget-procedures.md) if burn rates exceed limits.
