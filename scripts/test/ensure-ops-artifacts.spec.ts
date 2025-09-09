const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { runScript } = require('./utils/workflow.ts');

const script = require.resolve('../ensure-ops-artifacts.ts');

test('passes when ops-artifacts-verify job has always condition', () => {
  const exitMock = mock.method(process, 'exit');
  runScript(script, (dir: string) => {
    mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
    writeFileSync(
      join(dir, '.github', 'workflows', 'ci.yml'),
      `on: push\njobs:\n  ops-artifacts-verify:\n    # ensure artifacts\n    if: \${{ always() }}\n    uses: ./.github/workflows/ops-artifacts-verify.yml\n`,
    );
  });
  assert.equal(exitMock.mock.calls.length, 0);
  exitMock.mock.restore();
});

test('fails when ops-artifacts-verify job missing always condition', () => {
  const exitMock = mock.method(process, 'exit', (code?: number) => {
    throw new Error(String(code));
  });
  let err: Error | undefined;
  try {
    runScript(script, (dir: string) => {
      mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
      writeFileSync(
        join(dir, '.github', 'workflows', 'ci.yml'),
        `on: push\n# missing if\njobs:\n  ops-artifacts-verify:\n    uses: ./.github/workflows/ops-artifacts-verify.yml\n`,
      );
    });
  } catch (e) {
    err = e as Error;
  }
  assert.equal(err?.message, '1');
  exitMock.mock.restore();
});
