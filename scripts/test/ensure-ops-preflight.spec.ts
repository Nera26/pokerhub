const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, mkdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

function runScript(dir: string) {
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    delete require.cache[require.resolve('../ensure-ops-preflight.ts')];
    require('../ensure-ops-preflight.ts');
  } finally {
    process.chdir(cwd);
  }
}

test('passes when workflow uses ops-preflight action with always condition', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wf-'));
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(dir, '.github', 'workflows', 'ci.yml'),
    `on: push\njobs:\n  build:\n    steps:\n    - if: \${{ always() }}\n      uses: ./.github/actions/ops-preflight\n`,
  );
  const exitMock = mock.method(process, 'exit');
  runScript(dir);
  assert.equal(exitMock.mock.calls.length, 0);
  exitMock.mock.restore();
});

test('fails when workflow missing ops-preflight action', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wf-'));
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(dir, '.github', 'workflows', 'ci.yml'),
    `on: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n`,
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

test('fails when ops-preflight step missing always condition', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wf-'));
  mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(dir, '.github', 'workflows', 'ci.yml'),
    `on: push\njobs:\n  build:\n    steps:\n    - uses: ./.github/actions/ops-preflight\n`,
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
