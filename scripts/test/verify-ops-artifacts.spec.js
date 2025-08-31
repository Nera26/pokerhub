require('ts-node/register');
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const verify = require('../verify-ops-artifacts.ts');

const nowIso = new Date().toISOString();
const staleIso = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();

test('checkProofArchive fails for stale manifest', () => {
  const outputs = {
    'cat gs://proof/latest/manifest.txt': 'abc  file1\n',
    'cat gs://proof/latest/file1': Buffer.from('data'),
    'ls --format=json gs://proof/latest/file1': JSON.stringify([
      { timeCreated: nowIso },
    ]),
    'ls --format=json gs://proof/latest/manifest.txt': JSON.stringify([
      { timeCreated: staleIso },
    ]),
  };
  mock.method(verify.gcloud, 'run', (cmd) => outputs[cmd]);
  assert.throws(() => verify.checkProofArchive('proof'), /manifest.*older than 24h/);
  mock.restoreAll();
});

test('checkSpectatorLogs fails when logs are stale', () => {
  const listing = JSON.stringify([{ timeCreated: staleIso }]);
  mock.method(verify.gcloud, 'run', () => listing);
  assert.throws(() => verify.checkSpectatorLogs('spec', 'run1'), /older than 24h/);
  mock.restoreAll();
});

test('checkSoakMetrics fails when metrics are stale', () => {
  const listing = JSON.stringify([{ timeCreated: staleIso }]);
  mock.method(verify.gcloud, 'run', () => listing);
  assert.throws(() => verify.checkSoakMetrics('soak'), /older than 24h/);
  mock.restoreAll();
});

test('checkDrMetrics enforces RTO threshold', () => {
  const listing = JSON.stringify([
    { name: 'gs://dr/run1/drill.metrics', timeCreated: nowIso },
  ]);
  const outputs = {
    'ls --format=json gs://dr/**/drill.metrics': listing,
    'cat gs://dr/run1/drill.metrics': 'RTO_SECONDS=1900\nRPO_SECONDS=100\n',
  };
  mock.method(verify.gcloud, 'run', (cmd) => outputs[cmd]);
  assert.throws(() => verify.checkDrMetrics('dr'), /RTO 1900s exceeds/);
  mock.restoreAll();
});

test('checkDrMetrics enforces RPO threshold', () => {
  const listing = JSON.stringify([
    { name: 'gs://dr/run1/drill.metrics', timeCreated: nowIso },
  ]);
  const outputs = {
    'ls --format=json gs://dr/**/drill.metrics': listing,
    'cat gs://dr/run1/drill.metrics': 'RTO_SECONDS=100\nRPO_SECONDS=400\n',
  };
  mock.method(verify.gcloud, 'run', (cmd) => outputs[cmd]);
  assert.throws(() => verify.checkDrMetrics('dr'), /RPO 400s exceeds/);
  mock.restoreAll();
});

test('checkDrMetrics fails when metrics are stale', () => {
  const listing = JSON.stringify([
    { name: 'gs://dr/run1/drill.metrics', timeCreated: staleIso },
  ]);
  mock.method(verify.gcloud, 'run', () => listing);
  assert.throws(() => verify.checkDrMetrics('dr'), /older than 24h/);
  mock.restoreAll();
});

test('checkDrMetrics passes for fresh metrics within thresholds', () => {
  const listing = JSON.stringify([
    { name: 'gs://dr/run1/drill.metrics', timeCreated: nowIso },
  ]);
  const outputs = {
    'ls --format=json gs://dr/**/drill.metrics': listing,
    'cat gs://dr/run1/drill.metrics': 'RTO_SECONDS=100\nRPO_SECONDS=200\n',
  };
  mock.method(verify.gcloud, 'run', (cmd) => outputs[cmd]);
  assert.doesNotThrow(() => verify.checkDrMetrics('dr'));
  mock.restoreAll();
});
