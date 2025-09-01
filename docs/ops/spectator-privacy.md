# Spectator Privacy Metrics

The spectator privacy workflow publishes a custom Cloud Monitoring metric
`custom.googleapis.com/spectator_privacy/run_success` after completing its
DLP scan. Each point has:

- **Value:** `1` on success
- **Labels:**
  - `run_id` – GitHub Actions run identifier
  - `commit_sha` – commit hash used for the run

This metric allows the `scripts/verify-ops-artifacts.ts` check to verify that a
successful run occurred in the last 24 h.

## Retention

Custom metrics in Cloud Monitoring are retained for **6 weeks**. No additional
configuration is required, but the verifying script expects at least one data
point within the last 24 h.

## Alerting

To alert when the metric stops reporting:

1. Open **Cloud Monitoring → Alerting** and create a new policy.
2. Choose the metric `custom.googleapis.com/spectator_privacy/run_success` with
   the resource type `global`.
3. Set a condition using **Metric absence** for a duration of 24 h.
4. Add a notification channel (email, Slack, etc.) and save the policy.

This ensures operators are notified if the spectator privacy workflow fails to
publish metrics.
