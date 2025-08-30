# Wallet Throughput

Investigates drops in wallet transaction throughput.

## Dashboard
- Grafana: [Wallet Throughput](../../infrastructure/observability/wallet-throughput-dashboard.json)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE123)
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Inspect wallet service logs for stalled jobs or errors.
2. Check external payment provider status pages.
3. Roll back or scale the wallet service if throughput remains low.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when budget burn accelerates.
