# Ops Metrics

Operational soak and disaster recovery drill metrics are stored in the BigQuery dataset `ops_metrics`.
CI jobs such as `scripts/ensure-dr-drill.ts` query this dataset using the Node BigQuery client
(`@google-cloud/bigquery`), removing the need for the `bq` CLI.
Tables are automatically retained for 90 days via the dataset's default table expiration.

## Tables

- `soak_runs` – one row per soak test run with latency and throughput summaries.
- `dr_drill_runs` – one row per DR drill run with RTO/RPO measurements.
- `ops_verification` – ops artifacts verification status (`run_id`, `commit_sha`, `status`, `timestamp`).

## Querying

Example: list recent soak runs

```bash
bq query --nouse_legacy_sql \
  'SELECT timestamp, latency_p95_ms, throughput FROM ops_metrics.soak_runs ORDER BY timestamp DESC LIMIT 10'
```

Example: average RTO over last 30 drills

```bash
bq query --nouse_legacy_sql \
  'SELECT AVG(rto_seconds) FROM ops_metrics.dr_drill_runs WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)'
```

## Retention

Rows older than 90 days are automatically deleted. Export anything that needs to be kept longer to GCS before expiry.

Escalation paths for soak metric regressions are documented in the [GCP Ops Runbook](../gcp-ops-runbook.md).
