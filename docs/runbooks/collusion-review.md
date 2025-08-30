# Collusion Review Runbook

This runbook outlines how administrators review flagged sessions for potential collusion.

## Dashboard
- Metabase: [Collusion Review](../analytics-dashboards.md)

## PagerDuty Escalation
- Service: `pokerhub-eng`

## Access Requirements
- Only users with the `admin` role can access `/admin/collusion`.
- Log in with an admin account before proceeding.
- Include the `Authorization: Bearer <token>` header on review API requests.

## Workflow
1. Navigate to `/admin/collusion`.
2. The page fetches flagged sessions via `GET /review/sessions`.
3. Each session lists the involved users and current review status.
4. To escalate a session, select the action button. Available actions progress as:
   - `warn` → `restrict`
   - `restrict` → `ban`
5. Clicking the button issues `POST /review/sessions/:id/:action` using the next action.
6. Confirm the session status updates in the table.

## Investigation
1. Gather the flagged session ID and list of involved users.
2. Review shared devices, IP addresses, chip transfers, and timing patterns.
3. Compare VPIP correlations and seat proximity for suspicious alignment.
4. Document findings and evidence in the incident tracker.

## Remediation
- Escalate the session via `warn`, `restrict`, or `ban` actions once collusion is confirmed.
- Reverse illegitimate chip transfers and notify affected players.
- Log remediation details and follow-up tasks before closing the incident.

## Notes
- Actions use the `ReviewAction` type defined in `shared/types.ts`.
- If you encounter authorization errors, verify your admin role and authentication token.
