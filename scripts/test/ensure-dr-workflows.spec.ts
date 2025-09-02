const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const child_process = require('node:child_process');

function runScript() {
  delete require.cache[require.resolve('../ensure-dr-workflows.ts')];
  require('../ensure-dr-workflows.ts');
}

test('passes when workflows are fresh', () => {
  mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-01').getTime() });
  const execMock = mock.method(child_process, 'execSync', (cmd: string) => {
    const match = cmd.match(/workflow='([^']+)'/);
    const wf = match ? match[1] : '';
    const tsMap = {
      'dr-failover': '2024-05-25T00:00:00Z',
      'dr-restore': '2024-05-30T00:00:00Z',
      'dr-throwaway': '2024-05-28T00:00:00Z',
      'dr-drill': '2024-05-29T00:00:00Z',
    } as Record<string, string>;
    return JSON.stringify([{ timestamp: tsMap[wf] }]);
  });
  const exitMock = mock.method(process, 'exit');
  runScript();
  assert.equal(exitMock.mock.calls.length, 0);
  execMock.mock.restore();
  exitMock.mock.restore();
  mock.timers.reset();
});

test('fails when workflow exceeds SLA', () => {
  mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-01').getTime() });
  const execMock = mock.method(child_process, 'execSync', (cmd: string) => {
    const match = cmd.match(/workflow='([^']+)'/);
    const wf = match ? match[1] : '';
    const tsMap = {
      'dr-failover': '2024-03-01T00:00:00Z',
      'dr-restore': '2024-05-30T00:00:00Z',
      'dr-throwaway': '2024-05-28T00:00:00Z',
      'dr-drill': '2024-05-29T00:00:00Z',
    } as Record<string, string>;
    return JSON.stringify([{ timestamp: tsMap[wf] }]);
  });
  const exitMock = mock.method(process, 'exit', (code?: number) => { throw new Error(String(code)); });
  let err;
  try {
    runScript();
  } catch (e) {
    err = e;
  }
  assert.equal((err as Error).message, '1');
  execMock.mock.restore();
  exitMock.mock.restore();
  mock.timers.reset();
});
