const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const child_process = require('node:child_process');

function runScript() {
  delete require.cache[require.resolve('../check-soak-metrics.ts')];
  require('../check-soak-metrics.ts');
}

test('succeeds when metrics are within thresholds', () => {
  const dir = mkdtempSync(join(tmpdir(), 'soak-'));
  const cwd = process.cwd();
  process.chdir(dir);

  const rows = [
    { timestamp: '2024-01-02T00:00:00Z', latency_p95_ms: 110, throughput: 1.2, gc_pause_p95_ms: 40 },
    { timestamp: '2024-01-01T00:00:00Z', latency_p95_ms: 100, throughput: 1.0, gc_pause_p95_ms: 35 },
  ];

  const originalExec = child_process.execSync;
  (child_process as any).execSync = (cmd: string) => {
    if (cmd.startsWith('bq query')) return Buffer.from(JSON.stringify(rows));
    if (cmd.startsWith('gcloud monitoring metrics write')) return Buffer.from('');
    throw new Error('unexpected command');
  };

  const exitMock = mock.method(process, 'exit');

  runScript();

  assert.equal(exitMock.mock.calls.length, 0);
  const summary = JSON.parse(readFileSync('soak-summary.json', 'utf-8'));
  assert.equal(summary.latencyP95, 110);
  assert.equal(summary.throughput, 1.2);
  assert.equal(summary.gcPauseP95, 40);
  assert.equal(summary.regressions.length, 0);
  assert.ok(!existsSync('soak-regression.json'));

  (child_process as any).execSync = originalExec;
  exitMock.mock.restore();
  process.chdir(cwd);
});

test('fails when latency, throughput, or gc pause exceed thresholds', () => {
  const dir = mkdtempSync(join(tmpdir(), 'soak-'));
  const cwd = process.cwd();
  process.chdir(dir);

  process.env.SOAK_THROUGHPUT_MIN = '1';

  const rows = [
    { timestamp: '2024-01-02T00:00:00Z', latency_p95_ms: 150, throughput: 0.5, gc_pause_p95_ms: 80 },
    { timestamp: '2024-01-01T00:00:00Z', latency_p95_ms: 100, throughput: 1.0, gc_pause_p95_ms: 35 },
  ];

  const originalExec = child_process.execSync;
  (child_process as any).execSync = (cmd: string) => {
    if (cmd.startsWith('bq query')) return Buffer.from(JSON.stringify(rows));
    if (cmd.startsWith('gcloud monitoring metrics write')) return Buffer.from('');
    throw new Error('unexpected command');
  };

  const exitMock = mock.method(process, 'exit', (code?: number) => {
    throw new Error(String(code));
  });

  let err: Error | undefined;
  try {
    runScript();
  } catch (e) {
    err = e as Error;
  }

  assert.equal(err?.message, '1');
  const summary = JSON.parse(readFileSync('soak-summary.json', 'utf-8'));
  assert(summary.regressions.some((r: any) => r.message.includes('Latency p95 150ms exceeds 120ms')));
  assert(summary.regressions.some((r: any) => r.message.includes('Throughput 0.5 < 1')));
  assert(summary.regressions.some((r: any) => r.message.includes('GC pause p95 80ms exceeds 50ms')));
  assert.ok(existsSync('soak-regression.json'));

  (child_process as any).execSync = originalExec;
  exitMock.mock.restore();
  process.chdir(cwd);
  delete process.env.SOAK_THROUGHPUT_MIN;
});
