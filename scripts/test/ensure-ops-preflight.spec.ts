const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { runScript } = require('./utils/workflow.ts');

const script = require.resolve('../ensure-ops-preflight.ts');

test('passes when workflow uses ops-preflight action with always condition', () => {
  const exitMock = mock.method(process, 'exit');
  runScript(script, (dir: string) => {
    mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
    writeFileSync(
      join(dir, '.github', 'workflows', 'ci.yml'),
      `on: push\njobs:\n  build:\n    steps:\n    - if: \${{ always() }}\n      uses: ./.github/actions/ops-preflight\n`,
    );
  });
  assert.equal(exitMock.mock.calls.length, 0);
  exitMock.mock.restore();
});

test('fails when workflow missing ops-preflight action', () => {
  const exitMock = mock.method(process, 'exit', (code?: number) => {
    throw new Error(String(code));
  });
  let err: Error | undefined;
  try {
    runScript(script, (dir: string) => {
      mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
      writeFileSync(
        join(dir, '.github', 'workflows', 'ci.yml'),
        `on: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n`,
      );
    });
  } catch (e) {
    err = e as Error;
  }
  assert.equal(err?.message, '1');
  exitMock.mock.restore();
});

test('fails when ops-preflight step missing always condition', () => {
  const exitMock = mock.method(process, 'exit', (code?: number) => {
    throw new Error(String(code));
  });
  let err: Error | undefined;
  try {
    runScript(script, (dir: string) => {
      mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
      writeFileSync(
        join(dir, '.github', 'workflows', 'ci.yml'),
        `on: push\njobs:\n  build:\n    steps:\n    - uses: ./.github/actions/ops-preflight\n`,
      );
    });
  } catch (e) {
    err = e as Error;
  }
  assert.equal(err?.message, '1');
  exitMock.mock.restore();
});
