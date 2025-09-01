# Disaster Recovery Metrics

The `dr-trends` workflow writes RTO and RPO trend values to Google Cloud Monitoring for visibility:

- `custom.googleapis.com/dr/rto_trend`
- `custom.googleapis.com/dr/rpo_trend`

## Targets
- **RTO:** 1,800 seconds (30 minutes)
- **RPO:** 300 seconds (5 minutes)

## Alerts
The CI job evaluates these metrics. When the latest or average values exceed their targets, a PagerDuty alert is triggered for the DR service. On-call engineers should acknowledge the incident, investigate the failing drill, and follow the disaster recovery runbook.
