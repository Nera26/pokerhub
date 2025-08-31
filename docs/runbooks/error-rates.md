# Error Rates

Responding to elevated application error rates.

## Monitoring
- Grafana: [Error Rates](https://grafana.pokerhub.example/d/error-rates) (UID `error-rates`)
- Metabase: [Latency & Error Overview](https://metabase.pokerhub.example/dashboard/latency-error-overview)

## Alerting
- Route: [`pokerhub-sre`](../../metrics/alert-routes.md#pokerhub-sre) (PagerDuty ID: PSRE789)
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Confirm which services are returning errors.
2. Review recent deploys and logs for stack traces.
3. Roll back problematic deployments.
4. Engage service owners for persistent issues.

Follow [Error Budget Procedures](../error-budget-procedures.md) if burn rates exceed limits.
