const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, mkdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { runScript, mockExit } = require('./utils/workflow.ts');

const entry = require.resolve('../ensure-soak-metrics.ts');

test('passes when soak job has downstream soak-metrics job', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wf-'));
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(dir, '.github', 'workflows', 'ci.yml'),
    `on: push\njobs:\n  soak:\n    uses: ./.github/workflows/soak.yml\n    if: \${{ always() }} # comment\n  soak-metrics:\n    if: \${{ always() }}\n    needs:\n      - soak # comment\n    uses: ./.github/workflows/soak-metrics.yml\n`,
  );
  const exitMock = mockExit();
  runScript(dir, entry);
  assert.equal(exitMock.mock.calls.length, 0);
  exitMock.mock.restore();
});

test('fails when soak job missing soak-metrics job', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wf-'));
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(dir, '.github', 'workflows', 'ci.yml'),
    `on: push\n# no metrics job\njobs:\n  soak:\n    uses: ./.github/workflows/soak.yml\n    if: \${{ always() }}\n`,
  );
  const exitMock = mockExit();
  let err: Error | undefined;
  try {
    runScript(dir, entry);
  } catch (e) {
    err = e as Error;
  }
  assert.equal(err?.message, '1');
  exitMock.mock.restore();
});

test('fails when nested workflow directory missing soak-metrics job', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wf-'));
  // Root workflow with valid soak and metrics to ensure failure comes from nested dir
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(dir, '.github', 'workflows', 'root.yml'),
    `on: push\njobs:\n  soak:\n    if: \${{ always() }}\n    uses: ./.github/workflows/soak.yml\n  soak-metrics:\n    needs: soak\n    if: \${{ always() }}\n    uses: ./.github/workflows/soak-metrics.yml\n`,
  );
  // Nested workflow missing soak-metrics job
  mkdirSync(join(dir, 'frontend', '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(dir, 'frontend', '.github', 'workflows', 'ci.yml'),
    `on: push\njobs:\n  soak:\n    if: \${{ always() }}\n    uses: ./.github/workflows/soak.yml\n`,
  );
  const exitMock = mockExit();
  let err: Error | undefined;
  try {
    runScript(dir, entry);
  } catch (e) {
    err = e as Error;
  }
  assert.equal(err?.message, '1');
  exitMock.mock.restore();
});
