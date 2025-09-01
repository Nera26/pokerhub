# GCP Operations Runbook

High-level playbook for responding to infrastructure incidents in Google Cloud Platform.

## Disaster Recovery
- Promote replicas and update DNS using `infra/disaster-recovery/failover.sh` when the primary region is lost.
- Restore services from the latest snapshots with `infra/disaster-recovery/restore-latest.sh`.
- Verify **RTO ≤ 30 min** and **RPO ≤ 5 min**; escalate via PagerDuty service `pokerhub-eng` if objectives are unmet.

See [disaster recovery metrics](ops/disaster-recovery.md) and [runbook](runbooks/disaster-recovery.md) for detailed procedures.

## Spectator Privacy Remediation
- Review `spectator_privacy` workflow logs for failing DLP scans.
- Sanitize offending logs, re-run tests, and ensure the metric `custom.googleapis.com/spectator_privacy/run_success` reports within 24 h.
- Page on-call if the metric is absent; track remediation in incident notes.

See [spectator privacy metrics](ops/spectator-privacy.md) for metric definitions.

## Soak Metric Escalation
- Monitor `ops_metrics.soak_runs` for latency or throughput regressions.
- When thresholds exceed SLOs, page `pokerhub-sre` and open an incident ticket.
- Use the soak testing runbooks under `runbooks/soak-testing.md` to reproduce and mitigate.

See [ops metrics](ops/metrics.md) for table schema and thresholds.

## Proof Archive Restoration
- Fetch the latest manifest from `gs://$PROOF_MANIFEST_BUCKET/latest` and download `proof-summary.json`.
- Verify the KMS signature and restore the summary to `$PROOF_ARCHIVE_BUCKET`.
- If archives are missing, regenerate proofs and upload a new signed manifest.

See [proof archive audit](ops/proof-archive.md) and [runbook](runbooks/proof-archive.md) for details.
