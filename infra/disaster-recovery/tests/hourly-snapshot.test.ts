import { mkdtempSync, writeFileSync, readFileSync, chmodSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { strict as assert } from 'node:assert';

// create a temporary directory with a stub gcloud script that logs calls
const stubDir = mkdtempSync(join(tmpdir(), 'gcloud-stub-'));
const logFile = join(stubDir, 'gcloud.log');
const gcloudPath = join(stubDir, 'gcloud');
writeFileSync(
  gcloudPath,
  `#!/usr/bin/env bash\n` +
    `echo "$@" >> "${logFile}"\n`
);
chmodSync(gcloudPath, 0o755);

const env = {
  ...process.env,
  PATH: `${stubDir}:${process.env.PATH}`,
  PG_INSTANCE_ID: 'primary',
  SECONDARY_REGION: 'us-east-1',
  PROJECT_ID: 'test-project'
};

const result = spawnSync('bash', ['infra/disaster-recovery/tests/hourly-snapshot.sh'], {
  env,
  stdio: 'inherit'
});

if (result.error) {
  throw result.error;
}

assert.equal(result.status, 0, `hourly-snapshot.sh exited with code ${result.status}`);

const log = readFileSync(logFile, 'utf8');
assert(/sql backups copy hourly-\d+/.test(log), 'gcloud sql backups copy not invoked');

console.log('hourly-snapshot.sh invoked gcloud sql backups copy');

