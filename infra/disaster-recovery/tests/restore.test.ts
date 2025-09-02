import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { strict as assert } from 'node:assert';

const env = {
  ...process.env,
  PROJECT_ID: process.env.PROJECT_ID || 'test-project',
  SECONDARY_REGION: process.env.SECONDARY_REGION || 'us-east-2',
  PG_BACKUP_ID: process.env.PG_BACKUP_ID || 'pg-backup-id'
};

// run the restore script which writes RPO metrics
const result = spawnSync('bash', ['infra/disaster-recovery/tests/restore-backup.sh'], {
  env,
  stdio: 'inherit'
});

if (result.error) {
  throw result.error;
}
assert.equal(result.status, 0, `restore-backup.sh exited with code ${result.status}`);

const metrics = readFileSync('infra/disaster-recovery/tests/restore-backup.metrics', 'utf8');
const match = metrics.match(/RPO_SECONDS=(\d+)/);
assert.ok(match, 'RPO_SECONDS missing from metrics');
const rpo = Number(match[1]);
assert.ok(rpo <= 300, `RPO ${rpo}s exceeds 5 minute objective`);

console.log(`RPO ${rpo}s within objective`);
