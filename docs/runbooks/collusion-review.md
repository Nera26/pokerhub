# Collusion Review Runbook
<!-- Update service IDs in this file if PagerDuty services change -->

This runbook outlines how administrators review flagged sessions for potential collusion.


## Dashboard
- Metabase: [Collusion Review](../analytics-dashboards.md)

## PagerDuty Escalation
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->

Refer to [../security/anti-collusion.md](../security/anti-collusion.md) for details on detection heuristics and analytics queries.

## Background Job
- `CollusionDetectionJob` scans game analytics every 10 minutes and populates the flagged session list.
- If no new sessions appear for more than an hour, inspect analytics worker logs and Redis connectivity.

## Scheduled Queries
- Hourly ClickHouse queries detect shared IP use, chip dumping and synchronized betting patterns.
- Query results are stored in `collusion_alerts` and surfaced on the dashboard.

## Heuristics
`CollusionDetectionJob` writes matches into `collusion_alerts` for review workflows.

## Alerts
- Each new entry in `collusion_alerts` emits a Slack notification and opens a Jira ticket.
- If alert volume exceeds 20 per hour, page `pokerhub-eng` (ID: PENG012) to check for runaway heuristics.

## Access Requirements
- Only users with the `admin` role can access `/admin/collusion`.
- Log in with an admin account before proceeding.
- Include the `Authorization: Bearer <token>` header on review API requests.

## Review Procedure
1. Confirm the latest job run timestamp on the dashboard; investigate if older than 15 minutes.
2. Navigate to `/admin/collusion` and load flagged sessions via `GET /review/sessions`.
3. For deeper context, request `GET /review/sessions/:id/details` to inspect feature payloads.
4. Select the action button to escalate the session. Actions progress as:
   - `warn` → `restrict`
   - `restrict` → `ban`
5. Clicking the button issues `POST /review/sessions/:id/:action` using the next action and updates the table.
6. Attach evidence (hand histories, IP logs) to the Jira ticket for auditability.

## Investigation
1. Gather the flagged session ID and list of involved users.
2. Review shared devices, IP addresses, chip transfers, and timing patterns.
3. Compare VPIP correlations and seat proximity for suspicious alignment.
4. Document findings and evidence in the incident tracker and link to the Jira ticket.

## Worked Example

1. **Retrieve evidence**: `GET /review/sessions/abc123/details` returns `sharedIps: ["10.0.0.5"]`, `betCorrelation: 0.82`, and `timingSimilarity: 0.91`.
2. **Map to threats**: Cross-reference the [collusion service threat model](../security/threat-model.md#collusion-service) to align features with STRIDE categories.
   - `sharedIps` addresses **Spoofing**.
   - `betCorrelation` and `timingSimilarity` mitigate **Tampering** and **Repudiation**.
3. **Validate mitigations**: Ensure evidence hashes and reviewer actions match the expectations in the threat model and [Anti-Collusion Monitoring](../security/anti-collusion.md).
4. **Record conclusion**: Summarize which STRIDE threats were confirmed or ruled out and attach the analysis to the Jira ticket.

## Remediation
- Escalate the session via `warn`, `restrict`, or `ban` actions once collusion is confirmed.
- Reverse illegitimate chip transfers and notify affected players.
- Log remediation details and follow-up tasks before closing the incident.
- Archive the investigation packet in encrypted storage for **5 years**.

## Notes
- Actions use the `ReviewAction` type defined in `shared/types.ts`.
- If you encounter authorization errors, verify your admin role and authentication token.

## Appendix: Audit Queries and Retention

### Sample Queries
- `SELECT * FROM collusion_audit WHERE session_id = '{sessionId}' ORDER BY timestamp DESC;`
- `SELECT reviewer_id, count(*) FROM collusion_audit WHERE action = 'ban' AND timestamp >= now() - INTERVAL 30 DAY GROUP BY reviewer_id;`

### Retention Policy
- Records in `collusion_audit` are kept for **5 years** to satisfy regulatory requirements.
- A daily job purges data older than the retention window after exporting to cold storage.

## See Also
- [RNG Whitepaper](../player/rng-whitepaper.md)
- [RNG Fairness Spec](../rng-fairness.md)
