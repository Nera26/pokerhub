# Collusion Review Runbook

This runbook outlines how administrators review flagged sessions for potential collusion.

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

## Notes
- Actions use the `ReviewAction` type defined in `shared/types.ts`.
- If you encounter authorization errors, verify your admin role and authentication token.

