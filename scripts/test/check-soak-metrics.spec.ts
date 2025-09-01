const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, existsSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const child_process = require('node:child_process');

function runScript() {
  delete require.cache[require.resolve('../check-soak-metrics.ts')];
  require('../check-soak-metrics.ts');
}

test('fails when SOAK_TRENDS_BUCKET env var is missing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'soak-'));
  const cwd = process.cwd();
  process.chdir(dir);

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
  assert.equal(summary.regressions[0].message, 'SOAK_TRENDS_BUCKET env var required');
  assert.ok(existsSync('soak-regression.json'));

  exitMock.mock.restore();
  process.chdir(cwd);
});

test('succeeds when metrics are within thresholds', () => {
  const dir = mkdtempSync(join(tmpdir(), 'soak-'));
  const cwd = process.cwd();
  process.chdir(dir);

  process.env.SOAK_TRENDS_BUCKET = 'bucket';

  const now = new Date();
  const objects = [
    { name: 'old/baseline.json', updated: new Date(now.getTime() - 3600 * 1000).toISOString() },
    { name: 'new/baseline.json', updated: now.toISOString() },
  ];

  const originalExec = child_process.execSync;
  (child_process as any).execSync = ((cmd: string) => {
    if (cmd.startsWith('gcloud storage ls')) {
      return Buffer.from(JSON.stringify(objects));
    }
    const match = cmd.match(/gcloud storage cp (\S+) (\S+)/);
    if (match) {
      const [, src, dest] = match;
      if (src.startsWith('old')) {
        if (src.endsWith('baseline.json')) {
          writeFileSync(dest, JSON.stringify({ latency: { p95: 100 } }));
        } else {
          writeFileSync(dest, JSON.stringify({ a: 86400 }));
        }
      } else {
        if (src.endsWith('baseline.json')) {
          writeFileSync(dest, JSON.stringify({ latency: { p95: 110 } }));
        } else {
          writeFileSync(dest, JSON.stringify({ a: 86400 }));
        }
      }
      return Buffer.from('');
    }
    if (cmd.startsWith('gcloud monitoring metrics write')) return Buffer.from('');
    throw new Error('unexpected command');
  }) as any;

  const exitMock = mock.method(process, 'exit');

  runScript();

  assert.equal(exitMock.mock.calls.length, 0);
  const summary = JSON.parse(readFileSync('soak-summary.json', 'utf-8'));
  assert.equal(summary.latencyP95, 110);
  assert.equal(summary.throughput, 1);
  assert.equal(summary.regressions.length, 0);
  assert.ok(!existsSync('soak-regression.json'));

  (child_process as any).execSync = originalExec;
  exitMock.mock.restore();
  process.chdir(cwd);
  delete process.env.SOAK_TRENDS_BUCKET;
});

test('fails when latency or throughput regress', () => {
  const dir = mkdtempSync(join(tmpdir(), 'soak-'));
  const cwd = process.cwd();
  process.chdir(dir);

  process.env.SOAK_TRENDS_BUCKET = 'bucket';
  process.env.SOAK_THROUGHPUT_MIN = '1';

  const now = new Date();
  const objects = [
    { name: 'old/baseline.json', updated: new Date(now.getTime() - 3600 * 1000).toISOString() },
    { name: 'new/baseline.json', updated: now.toISOString() },
  ];

  const originalExec = child_process.execSync;
  (child_process as any).execSync = ((cmd: string) => {
    if (cmd.startsWith('gcloud storage ls')) {
      return Buffer.from(JSON.stringify(objects));
    }
    const match = cmd.match(/gcloud storage cp (\S+) (\S+)/);
    if (match) {
      const [, src, dest] = match;
      if (src.startsWith('old')) {
        if (src.endsWith('baseline.json')) {
          writeFileSync(dest, JSON.stringify({ latency: { p95: 100 } }));
        } else {
          writeFileSync(dest, JSON.stringify({ a: 86400 }));
        }
      } else {
        if (src.endsWith('baseline.json')) {
          writeFileSync(dest, JSON.stringify({ latency: { p95: 150 } }));
        } else {
          writeFileSync(dest, JSON.stringify({ a: 43200 }));
        }
      }
      return Buffer.from('');
    }
    if (cmd.startsWith('gcloud monitoring metrics write')) return Buffer.from('');
    throw new Error('unexpected command');
  }) as any;

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
  assert.ok(existsSync('soak-regression.json'));

  (child_process as any).execSync = originalExec;
  exitMock.mock.restore();
  process.chdir(cwd);
  delete process.env.SOAK_TRENDS_BUCKET;
  delete process.env.SOAK_THROUGHPUT_MIN;
});

