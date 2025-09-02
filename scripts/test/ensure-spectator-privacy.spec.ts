const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, mkdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

function runScript(dir: string) {
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    delete require.cache[require.resolve('../ensure-spectator-privacy.ts')];
    require('../ensure-spectator-privacy.ts');
  } finally {
    process.chdir(cwd);
  }
}

test('passes when spectator-privacy job has always condition', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wf-'));
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(dir, '.github', 'workflows', 'ci.yml'),
    `on: push\njobs:\n  spectator-privacy:\n    if: \${{ always() }}\n    uses: ./.github/workflows/spectator-privacy.yml\n`,
  );
  const exitMock = mock.method(process, 'exit');
  runScript(dir);
  assert.equal(exitMock.mock.calls.length, 0);
  exitMock.mock.restore();
});

test('fails when spectator-privacy job missing always condition', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wf-'));
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(dir, '.github', 'workflows', 'ci.yml'),
    `on: push\njobs:\n  spectator-privacy:\n    uses: ./.github/workflows/spectator-privacy.yml\n`,
  );
  const exitMock = mock.method(process, 'exit', (code?: number) => {
    throw new Error(String(code));
  });
  let err: Error | undefined;
  try {
    runScript(dir);
  } catch (e) {
    err = e as Error;
  }
  assert.equal(err?.message, '1');
  exitMock.mock.restore();
});

