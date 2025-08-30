# Emergency Fix Procedures

Use this guide to mitigate critical production issues when a rapid rollback or hotfix is required.

## Immediate Rollback

1. Trigger the **Deploy** workflow with the failed revision selected.
2. The workflow automatically invokes `scripts/rollback.sh` when health or metric checks fail.
3. To force a rollback manually:
   ```bash
   DEPLOY_ENV=production scripts/rollback.sh
   ```

## Hotfix Deployment

1. Commit the fix on a dedicated branch.
2. Run through the normal CI pipeline – all stages must pass.
3. Use `scripts/canary-deploy.sh` to ship a guarded canary:
   ```bash
   DEPLOY_ENV=production scripts/canary-deploy.sh
   ```
4. Monitor `$HEALTH_CHECK_URL` and Prometheus metrics. The script will auto‑rollback on failures.

## Post‑Incident

1. Open an incident report in `docs/runbooks/incident-procedures.md`.
2. Document root cause and remediation steps.
3. Schedule follow‑up tasks to prevent recurrence.
