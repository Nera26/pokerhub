import { mkdtempSync, writeFileSync, readFileSync, chmodSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { strict as assert } from 'node:assert';

// create temporary directory with stubs
const stubDir = mkdtempSync(join(tmpdir(), 'pitr-stub-'));
const secondaryRegion = 'us-east-1';

// stub gcloud to just log calls
const gcloudLog = join(stubDir, 'gcloud.log');
const gcloudPath = join(stubDir, 'gcloud');
writeFileSync(
  gcloudPath,
  `#!/usr/bin/env bash\n` +
    `echo \"$@\" >> \"${gcloudLog}\"\n`
);
chmodSync(gcloudPath, 0o755);

// stub gsutil so replication check passes
const gsutilPath = join(stubDir, 'gsutil');
writeFileSync(
  gsutilPath,
  `#!/usr/bin/env bash\n` +
    `echo \"$@\" >> \"${join(stubDir, 'gsutil.log')}\"\n`
);
chmodSync(gsutilPath, 0o755);

// stub curl to capture backup id and respond to list
const curlLog = join(stubDir, 'curl.log');
const backupIdFile = join(stubDir, 'backup_id');
const curlPath = join(stubDir, 'curl');
writeFileSync(
  curlPath,
  `#!/usr/bin/env bash\n` +
    `echo \"$@\" >> \"${curlLog}\"\n` +
    `if [[ "$*" == *"/copy"* ]]; then\n` +
    `  if [[ "$*" =~ backupRuns/([^/]+)/copy ]]; then\n` +
    `    echo \"\${BASH_REMATCH[1]}\" > \"${backupIdFile}\"\n` +
    `  fi\n` +
    `  exit 0\n` +
    `fi\n` +
    `if [[ "$*" == *"/backupRuns"* ]]; then\n` +
    `  id=$(cat \"${backupIdFile}\" 2>/dev/null)\n` +
    `  echo \"{\\\"items\\\":[{\\\"id\\\":\\\"$id\\\",\\\"location\\\":\\\"${secondaryRegion}\\\"}]}\"\n` +
    `  exit 0\n` +
    `fi\n`
);
chmodSync(curlPath, 0o755);

const env = {
  ...process.env,
  PATH: `${stubDir}:${process.env.PATH}`,
  PG_INSTANCE_ID: 'primary',
  CLICKHOUSE_BUCKET: 'click',
  SECONDARY_REGION: secondaryRegion,
  PROJECT_ID: 'test-project',
  CLOUD_SQL_ACCESS_TOKEN: 'token'
};

const result = spawnSync('bash', ['infra/disaster-recovery/tests/pitr-nightly.sh'], {
  env,
  stdio: 'inherit'
});

if (result.error) {
  throw result.error;
}
assert.equal(result.status, 0, `pitr-nightly.sh exited with code ${result.status}`);

const curlCalls = readFileSync(curlLog, 'utf8');
assert(/backupRuns\/[^/]+\/copy/.test(curlCalls), 'backup copy API not called');
const occurrences = curlCalls.match(/backupRuns/g) || [];
assert(occurrences.length >= 2, 'backup list API not called');

console.log('pitr-nightly.sh copied backup to secondary region');

