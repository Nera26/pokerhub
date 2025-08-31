# Proof Archive

Exports recent hand proofs to Google Cloud Storage each night.

## Storage
- Bucket: configured via the `PROOF_ARCHIVE_BUCKET` secret (e.g. `gs://pokerhub-proof-archive`).
- Retention: bucket lifecycle must retain proofs for at least 365 days.

## Metrics
- `custom.googleapis.com/proof/archive_count` – number of proofs exported each run.
- `custom.googleapis.com/proof/manifest_hash` – manifest SHA256 recorded as the `hash` label.

## Alerts
- Fails if no hand proofs are found in the last 24 hours.
- Sends notifications to Slack and PagerDuty on failure.

## PagerDuty
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->

## Playbook
1. Review the workflow logs in GitHub Actions to confirm the absence of proofs.
2. Inspect the database to ensure hands are being recorded with seeds and nonces.
3. Resolve the underlying issue and [rerun the workflow](https://docs.github.com/actions/managing-workflow-runs/re-running-workflows) once proofs are available.
