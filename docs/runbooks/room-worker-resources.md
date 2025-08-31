# Room Worker CPU/Mem

Handles situations where room workers consume excessive CPU or memory.
 
## Dashboard
- Grafana: [Room Worker Resources](../../infrastructure/observability/room-cpu-memory-dashboard.json)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE789) <!-- Update ID if PagerDuty service changes -->
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Determine which room worker pods are exceeding thresholds.
2. Check for memory leaks or hot loops in recent deployments.
3. Restart or scale the room worker deployment.
4. Roll back recent changes if resource usage remains high.

Refer to [Error Budget Procedures](../error-budget-procedures.md) if resources threaten SLOs.
