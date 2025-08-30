# Alert Routes

## PagerDuty Escalation Policies

- **Critical Service** (`pokerhub-critical`)
  1. Primary on-call
  2. SRE lead
  3. Engineering director
- **Telemetry Pipeline** (`pokerhub-telemetry`)
  1. Observability engineer
  2. Infrastructure manager

Grafana alerts should target the appropriate PagerDuty service to ensure timely incident response.
