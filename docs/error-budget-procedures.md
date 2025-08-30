# Error Budget Procedures

When service level objectives burn their monthly error budget, operators follow these escalation rules.

## 50% Budget Consumed
- Freeze feature deployments; only reliability fixes may ship.
- Review active incidents and prioritize mitigation work.
- Engineering manager approval is required for any production change.

## 100% Budget Consumed
- Roll back recent risky releases.
- Conduct an incident review and document corrective actions.
- No production changes proceed without engineering manager and CTO approval.

These procedures work in tandem with the thresholds defined in [SLOs.md](SLOs.md).
