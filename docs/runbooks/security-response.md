# Security Incident Response

This runbook defines procedures for handling security events at PokerHub.

## Detection
- Alerts from intrusion detection, anomaly analytics, or user reports.

## PagerDuty Policies
- Trigger the `Security Response` service for any suspected breach.
- Escalation policy `SECURITY-INCIDENT` pages Security On-Call then Security Lead, then CTO.
- Major incidents also engage the company-wide `Critical Incident` policy for executive visibility.

## Response Steps
1. **Triage** severity and scope of the incident.
2. **Contain** affected accounts or infrastructure to prevent spread.
3. **Eradicate** the root cause by applying fixes or revoking access.
4. **Recover** services and verify normal operations.
5. **Postmortem** within 5 business days with action items.

## Communication
- Use `#pokerhub-security` Slack channel for updates.
- Notify compliance and legal teams when customer data is involved.

## References
- [Security Guidelines](../security/incident-response.md)
