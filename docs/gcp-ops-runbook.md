# GCP Operations Runbook

High-level playbook for responding to infrastructure incidents in Google Cloud Platform.

## Disaster Recovery
- Promote replicas and update DNS using `infra/disaster-recovery/failover.sh` when the primary region is lost.
- Restore services from the latest snapshots with `infra/disaster-recovery/restore-latest.sh`.
- Verify **RTO ≤ 30 min** and **RPO ≤ 5 min**; escalate via PagerDuty service `pokerhub-eng` if objectives are unmet.

See [disaster recovery metrics](ops/disaster-recovery.md) and [runbook](runbooks/disaster-recovery.md) for detailed procedures.

## Disaster-Recovery Drills
- Weekly workflow [`.github/workflows/dr-drill.yml`](../.github/workflows/dr-drill.yml) executes `infra/disaster-recovery/drill.sh` to validate failover paths.
- Cadence: Mondays at 02:00 UTC; targets **RTO ≤ 1800 s**, **RPO ≤ 300 s**, and replication lag **≤ 900 s**.
- On failure, review drill logs, page `pokerhub-eng`, and rerun after remediation.
- [`scripts/ensure-dr-drill.ts`](../scripts/ensure-dr-drill.ts) queries `ops_metrics.dr_drill_runs` in BigQuery and fails if the latest drill is older than `$DR_DRILL_SLA_DAYS` (default 30); run `infra/disaster-recovery/drill.sh` and ensure metrics publish when this check fails.
- Verify Cloud Monitoring metric `custom.googleapis.com/dr/run_success`; a recent value of `1` indicates the latest drill succeeded. If the metric is missing or older than the SLA (default 30 days), treat it as stale and escalate.

## Spectator Log Sanitization & DLP Scanning
- Reusable workflow [`.github/workflows/spectator-privacy.yml`](../.github/workflows/spectator-privacy.yml) fetches logs, runs [`scripts/sanitize-spectator-logs.ts`](../scripts/sanitize-spectator-logs.ts), and scans with [`scripts/dlp-scan.ts`](../scripts/dlp-scan.ts).
- Optional [`scripts/fetch-prod-logs.ts`](../scripts/fetch-prod-logs.ts) pulls spectator logs from production before sanitization; sanitized files land in `gs://$SPECTATOR_LOGS_BUCKET`.
- [`scripts/ensure-spectator-privacy.ts`](../scripts/ensure-spectator-privacy.ts) ensures all workflows invoke the `spectator-privacy` job with `if: ${{ always() }}`.
- Confirm metric `custom.googleapis.com/spectator_privacy/run_success` within 24 h; if log fetch, sanitization, DLP scan, or the ensure check fails, inspect workflow logs and Cloud Storage, rerun the job, and page `pokerhub-sre` if issues persist.

See [spectator privacy metrics](ops/spectator-privacy.md) for metric definitions.

## Continuous Soak Metrics Ingestion
- Nightly workflow [`.github/workflows/soak-metrics.yml`](../.github/workflows/soak-metrics.yml) loads soak run stats to BigQuery.
- [`scripts/check-soak-metrics.ts`](../scripts/check-soak-metrics.ts) enforces **latency p95 ≤ 120 ms**, **throughput ≥ `SOAK_THROUGHPUT_MIN`**, and **GC pause p95 ≤ 50 ms**.
- [`scripts/ensure-soak-metrics.ts`](../scripts/ensure-soak-metrics.ts) requires workflows using `soak.yml` to have a downstream `soak-metrics` job with `if: ${{ always() }}`.
- Deployments require a soak-metrics entry newer than **24 h**; stale data triggers a failing preflight check.
- When thresholds regress, data is missing, or the ensure check fails, review BigQuery dataset `ops_metrics.soak_runs`, rerun the workflow, and page `pokerhub-sre` if problems remain; consult `runbooks/soak-testing.md` for deeper remediation.

See [ops metrics](ops/metrics.md) for table schema and thresholds.

## Proof Archive Generation & Audit
- Daily workflow [`.github/workflows/proof-archive.yml`](../.github/workflows/proof-archive.yml) exports hand proofs, signs manifests, and uploads to `$PROOF_ARCHIVE_BUCKET` and manifest buckets.
- Replication and retention are verified via [`scripts/check-proof-archive-replication.ts`](../scripts/check-proof-archive-replication.ts) and [`scripts/check-proof-archive-retention.ts`](../scripts/check-proof-archive-retention.ts).
- Nightly audit workflow [`.github/workflows/proof-archive-audit.yml`](../.github/workflows/proof-archive-audit.yml) validates counts and writes `custom.googleapis.com/proof/archive_audit_success`.
- [`scripts/ensure-proof-archive.ts`](../scripts/ensure-proof-archive.ts) asserts every workflow includes a `proof-archive` verification job with `if: ${{ always() }}`.
- On generation, audit, or ensure-check failure, inspect GCS buckets and workflow logs, rerun the failing job, and escalate to `pokerhub-sre` if the issue persists.

## Proof Archive Restoration
- Fetch the latest manifest from `gs://$PROOF_MANIFEST_BUCKET/latest` and download `proof-summary.json`.
- Verify the KMS signature and restore the summary to `$PROOF_ARCHIVE_BUCKET`.
- If archives are missing, regenerate proofs and upload a new signed manifest.

See [proof archive audit](ops/proof-archive.md) and [runbook](runbooks/proof-archive.md) for details.
