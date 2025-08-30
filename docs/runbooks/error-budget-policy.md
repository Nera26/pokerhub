# Error Budget Policy

PokerHub allocates a monthly error budget for each [SLO](../SLOs.md). The budget represents the portion of requests that may fail before reliability work takes priority.

## Enforcement
- **50% burned** in any rolling week: pause feature deploys and prioritise stability work.
- **100% burned**: trigger an incident review and require engineering manager approval for production changes.

## Paging
Burn‑rate alerts attach a `pagerduty_service` label which routes pages according to `infra/observability/pagerduty-*.yml`. On‑call engineers should follow the steps in [incident-procedures.md](incident-procedures.md).

## References
- [SLO targets](../SLOs.md)
- [PagerDuty burn‑rate config](../../infra/observability/pagerduty-telemetry.yml)
