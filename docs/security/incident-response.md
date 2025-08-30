# Security Incident Response

This runbook outlines how PokerHub handles security incidents from detection to resolution.

## Detection Sources
- Prometheus and Alertmanager security rules
- Intrusion detection system logs
- External reports (bug bounty, player support)
- Anomalies flagged by SLO dashboards or audit trails

## Severity Levels
| Level | Criteria | PagerDuty Service |
| ----- | -------- | ---------------- |
| **P1** | Confirmed data breach or ongoing compromise | `pokerhub-security` |
| **P2** | Suspicious activity with potential impact | `pokerhub-security` |
| **P3** | Low-risk vulnerability or informational report | — |

## Escalation Steps
1. **Acknowledge** the page in PagerDuty and create an incident channel (`#pokerhub-incident`).
2. **Triage** using logs, dashboards, and [threat models](threat-model.md).
3. **Contain** the issue by revoking credentials, blocking IPs, or isolating services.
4. **Notify** stakeholders: SRE, leadership, and affected teams.
5. **Eradicate & Recover**: patch, deploy fixes, and restore services.
6. **Post-mortem** within 5 business days.

## PagerDuty Routes
- Primary: `pokerhub-security` service
- Escalates to `pokerhub-sre` after 15 minutes
- Further escalation to **CTO** after 30 minutes

During drills, prefix the PagerDuty page with `[DRILL]` to avoid confusion with real incidents.
