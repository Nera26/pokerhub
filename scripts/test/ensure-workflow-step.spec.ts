const { test: t, mock } = require('node:test');
const assert = require('node:assert/strict');
const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { runScript } = require('./utils/workflow.ts');

// parametrized tests for workflow steps requiring `if: ${{ always() }}`
const cases = [
  {
    script: '../ensure-ops-artifacts.ts',
    name: 'ops-artifacts-verify',
    good: `on: push\njobs:\n  ops-artifacts-verify:\n    if: \${{ always() }}\n    uses: ./.github/workflows/ops-artifacts-verify.yml\n`,
    bad: `on: push\njobs:\n  ops-artifacts-verify:\n    uses: ./.github/workflows/ops-artifacts-verify.yml\n`,
  },
  {
    script: '../ensure-ops-preflight.ts',
    name: 'ops-preflight',
    good: `on: push\njobs:\n  build:\n    steps:\n      - if: \${{ always() }}\n        uses: ./.github/actions/ops-preflight\n`,
    bad: `on: push\njobs:\n  build:\n    steps:\n      - uses: ./.github/actions/ops-preflight\n`,
  },
];

cases.forEach(({ script, name, good, bad }) => {
  const entry = require.resolve(script);

  t(`passes when ${name} guarded with always()`, () => {
    const exitMock = mock.method(process, 'exit');
    runScript(entry, (dir: string) => {
      mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
      writeFileSync(join(dir, '.github', 'workflows', 'ci.yml'), good);
    });
    assert.equal(exitMock.mock.calls.length, 0);
    exitMock.mock.restore();
  });

  t(`fails when ${name} missing always()`, () => {
    const exitMock = mock.method(process, 'exit', (code?: number) => {
      throw new Error(String(code));
    });
    let err: Error | undefined;
    try {
      runScript(entry, (dir: string) => {
        mkdirSync(join(dir, '.github', 'workflows'), { recursive: true });
        writeFileSync(join(dir, '.github', 'workflows', 'ci.yml'), bad);
      });
    } catch (e) {
      err = e as Error;
    }
    assert.equal(err?.message, '1');
    exitMock.mock.restore();
  });
});
