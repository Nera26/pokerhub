const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const runbookPath = path.join(__dirname, '..', '..', 'docs', 'runbooks', 'disaster-recovery.md');

function runScript() {
  delete require.cache[require.resolve('../check-dr-runbook.ts')];
  require('../check-dr-runbook.ts');
}

test('passes when latest drill is fresh', () => {
  const content = `header\n<!-- DR_DRILL_RESULTS -->\n- 2024-05-15: drill`; // within 30 days of mocked now

  const original = fs.readFileSync;
  const readMock = mock.method(fs, 'readFileSync', (p: any, enc: any) => {
    if (p === runbookPath) return content;
    return original(p, enc);
  });
  const exitMock = mock.method(process, 'exit');
  mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-01').getTime() });

  runScript();

  assert.equal(exitMock.mock.calls.length, 0);

  exitMock.mock.restore();
  readMock.mock.restore();
  mock.timers.reset();
});

test('fails when latest drill is stale', () => {
  const content = `header\n<!-- DR_DRILL_RESULTS -->\n- 2024-01-01: drill`;

  const original = fs.readFileSync;
  const readMock = mock.method(fs, 'readFileSync', (p: any, enc: any) => {
    if (p === runbookPath) return content;
    return original(p, enc);
  });
  const exitMock = mock.method(process, 'exit', (code: any) => { throw new Error(String(code)); });
  mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-01').getTime() });

  let err: unknown;
  try {
    runScript();
  } catch (e) {
    err = e;
  }

  assert.equal((err as Error).message, '1');

  exitMock.mock.restore();
  readMock.mock.restore();
  mock.timers.reset();
});

test('fails when no drill timestamps are present', () => {
  const content = `header\n<!-- DR_DRILL_RESULTS -->\nno data`;

  const original = fs.readFileSync;
  const readMock = mock.method(fs, 'readFileSync', (p: any, enc: any) => {
    if (p === runbookPath) return content;
    return original(p, enc);
  });
  const exitMock = mock.method(process, 'exit', (code: any) => { throw new Error(String(code)); });
  mock.timers.enable({ apis: ['Date'], now: new Date('2024-06-01').getTime() });

  let err: unknown;
  try {
    runScript();
  } catch (e) {
    err = e;
  }

  assert.equal((err as Error).message, '1');

  exitMock.mock.restore();
  readMock.mock.restore();
  mock.timers.reset();
});
