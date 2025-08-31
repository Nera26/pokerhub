# Alert Routes

PagerDuty services ensure that alerts page the correct team with the appropriate urgency.
Grafana alert rules set the `pagerduty_service` label which maps to the services below.

## Service Mappings

| PagerDuty service | Team / scope | On‑call rotation | Severity tiers |
| --- | --- | --- | --- |
| `pokerhub-sre` | Core platform API and room workers | 24×7 weekly SRE rotation | Sev1, Sev2, Sev3 |
| `pokerhub-eng` | Feature engineering and frontend | Weekday business-hours rotation | Sev2, Sev3 |
| `pokerhub-ops` | Operations and partner integrations | Weekday business-hours rotation | Sev2, Sev3 |
| `pokerhub-observability` | Telemetry pipeline and monitoring stack | Bi-weekly 24×7 observability rotation | Sev2, Sev3 |
| `pokerhub-critical` | Site-wide incidents across services | Mirrors `pokerhub-sre` rotation with secondary | Sev1 only |

### `pokerhub-sre`
- Escalation: Primary on-call → SRE lead → Engineering director
- Handles outages, error spikes and latency issues for production services.

### `pokerhub-eng`
- Escalation: Feature on-call → Engineering manager → Director
- Covers feature rollouts and frontend performance regressions.

### `pokerhub-ops`
- Escalation: Ops on-call → Ops manager
- Used for payment failures and partner integration incidents.

### `pokerhub-observability`
- Escalation: Observability engineer → Infrastructure manager
- Responsible for the OpenTelemetry collectors and monitoring stack.

### `pokerhub-critical`
- Escalation: Primary on-call → SRE lead → Engineering director
- Reserved for Sev1 events impacting multiple services or causing total outages.

## Severity Tiers

| Tier | Impact | Response |
| --- | --- | --- |
| **Sev1** | Global outage or data loss | Page entire team immediately; use `pokerhub-critical` |
| **Sev2** | Partial outage or severe degradation | Page owning team; escalate if unresolved in 30 m |
| **Sev3** | Warning or localized issue | Handle during assigned on-call shift |

Grafana alerts should target the appropriate PagerDuty service to ensure timely incident response.
