# Collusion Review Runbook

This runbook outlines how administrators review flagged sessions for potential collusion.


## Dashboard
- Metabase: [Collusion Review](../analytics-dashboards.md)

## PagerDuty Escalation
- Service: `pokerhub-eng`

Refer to [../security/anti-collusion.md](../security/anti-collusion.md) for details on detection heuristics and analytics queries.

## Background Job
- `CollusionDetectionJob` scans game analytics every 10 minutes and populates the flagged session list.
- If no new sessions appear for more than an hour, inspect analytics worker logs and Redis connectivity.

## Alerts
- Each new entry in `collusion_alerts` emits a Slack notification and opens a Jira ticket.
- If alert volume exceeds 20 per hour, page `pokerhub-eng` to check for runaway heuristics.

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

## Remediation
- Escalate the session via `warn`, `restrict`, or `ban` actions once collusion is confirmed.
- Reverse illegitimate chip transfers and notify affected players.
- Log remediation details and follow-up tasks before closing the incident.
- Archive the investigation packet in encrypted storage for **5 years**.

## Notes
- Actions use the `ReviewAction` type defined in `shared/types.ts`.
- If you encounter authorization errors, verify your admin role and authentication token.

## See Also
- [RNG Whitepaper](../player/rng-whitepaper.md)
- [RNG Fairness Spec](../rng-fairness.md)
