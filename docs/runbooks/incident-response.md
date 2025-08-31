# Incident Response
<!-- Update service IDs in this file if PagerDuty services change -->

This runbook outlines generic steps for responding to production incidents.

## Initial Actions
1. **Acknowledge** the alert in PagerDuty.
2. **Triage** using dashboards and relevant service logs.
3. **Mitigate** impact or roll back offending changes.
4. **Communicate** status updates in `#pokerhub-incident`.

## AML/STRIDE Escalation
- Findings from [KYC/AML monitoring](../compliance/kyc-aml-flow.md) or the [STRIDE threat model](../security/stride-threat-model.md) follow this path:
  1. Page the `pokerhub-compliance` service and open a thread in `#pokerhub-compliance`.
  2. If player risk or system compromise is suspected, also page `pokerhub-security` and involve SRE on `pokerhub-sre`.
  3. For confirmed regulatory impact, escalate to legal and the CTO within 24 hours.

## Post-Incident
- File a post-mortem within 5 business days.
- Update runbooks and threat models with lessons learned.
