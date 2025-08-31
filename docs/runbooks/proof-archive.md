# Proof Archive

Exports recent hand proofs to S3 each night.

## Alerts
- Fails if no hand proofs are found in the last 24 hours.
- Sends notifications to Slack and PagerDuty on failure.

## PagerDuty
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->

## Playbook
1. Review the workflow logs in GitHub Actions to confirm the absence of proofs.
2. Inspect the database to ensure hands are being recorded with seeds and nonces.
3. Resolve the underlying issue and [rerun the workflow](https://docs.github.com/actions/managing-workflow-runs/re-running-workflows) once proofs are available.
