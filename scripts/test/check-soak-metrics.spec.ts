const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const child_process = require('node:child_process');
const { runScript, mockExit } = require('./utils/workflow.ts');

const entry = require.resolve('../check-soak-metrics.ts');

test('succeeds when metrics are within thresholds', () => {
  const dir = mkdtempSync(join(tmpdir(), 'soak-'));

  process.env.SOAK_METRICS_SLA_HOURS = '100000';

  const rows = [
    {
      timestamp: '2024-01-02T00:00:00Z',
      latency_p50_ms: 60,
      latency_p95_ms: 110,
      latency_p99_ms: 150,
      throughput: 1.2,
      gc_pause_p95_ms: 40,
      rss_delta_pct: 0.22,
    },
    {
      timestamp: '2024-01-01T00:00:00Z',
      latency_p50_ms: 55,
      latency_p95_ms: 100,
      latency_p99_ms: 130,
      throughput: 1.0,
      gc_pause_p95_ms: 35,
      rss_delta_pct: 0.2,
    },
  ];

  const originalExec = child_process.execSync;
  let gcloudCount = 0;
  (child_process as any).execSync = (cmd: string) => {
    if (cmd.startsWith('bq query')) return Buffer.from(JSON.stringify(rows));
    if (cmd.startsWith('gcloud monitoring metrics write')) {
      gcloudCount++;
      return Buffer.from('');
    }
    throw new Error('unexpected command');
  };

  const exitMock = mockExit();

  runScript(dir, entry);

  assert.equal(exitMock.mock.calls.length, 0);
  assert.equal(gcloudCount, 4);
  const summary = JSON.parse(readFileSync(join(dir, 'soak-summary.json'), 'utf-8'));
  assert.equal(summary.latency_p50_ms, 60);
  assert.equal(summary.latency_p95_ms, 110);
  assert.equal(summary.latency_p99_ms, 150);
  assert.equal(summary.throughput, 1.2);
  assert.equal(summary.gc_pause_p95_ms, 40);
  assert.equal(summary.rss_delta_pct, 0.22);
  assert.ok(!existsSync(join(dir, 'soak-regression.json')));

  (child_process as any).execSync = originalExec;
  exitMock.mock.restore();
});

test('fails when latency, throughput, or gc pause exceed thresholds', () => {
  const dir = mkdtempSync(join(tmpdir(), 'soak-'));

  process.env.SOAK_THROUGHPUT_MIN = '1';
  process.env.SOAK_METRICS_SLA_HOURS = '100000';

  const rows = [
    {
      timestamp: '2024-01-02T00:00:00Z',
      latency_p50_ms: 80,
      latency_p95_ms: 150,
      latency_p99_ms: 250,
      throughput: 0.5,
      gc_pause_p95_ms: 80,
      rss_delta_pct: 2,
    },
    {
      timestamp: '2024-01-01T00:00:00Z',
      latency_p50_ms: 55,
      latency_p95_ms: 100,
      latency_p99_ms: 130,
      throughput: 1.0,
      gc_pause_p95_ms: 35,
      rss_delta_pct: 0.2,
    },
  ];

  const originalExec = child_process.execSync;
  let gcloudCount = 0;
  (child_process as any).execSync = (cmd: string) => {
    if (cmd.startsWith('bq query')) return Buffer.from(JSON.stringify(rows));
    if (cmd.startsWith('gcloud monitoring metrics write')) {
      gcloudCount++;
      return Buffer.from('');
    }
    throw new Error('unexpected command');
  };

  const exitMock = mockExit();

  let err: Error | undefined;
  try {
    runScript(dir, entry);
  } catch (e) {
    err = e as Error;
  }

  assert.equal(err?.message, '1');
  assert.equal(gcloudCount, 4);
  const regression = JSON.parse(readFileSync(join(dir, 'soak-regression.json'), 'utf-8'));
  assert(
    regression.regressions.some((r: any) => r.message.includes('Latency p50 80ms exceeds 60ms')),
  );
  assert(
    regression.regressions.some((r: any) => r.message.includes('Latency p95 150ms exceeds 120ms')),
  );
  assert(
    regression.regressions.some((r: any) => r.message.includes('Latency p99 250ms exceeds 200ms')),
  );
  assert(regression.regressions.some((r: any) => r.message.includes('Throughput 0.5 < 1')));
  assert(
    regression.regressions.some((r: any) => r.message.includes('GC pause p95 80ms exceeds 50ms')),
  );
  assert(
    regression.regressions.some((r: any) => r.message.includes('RSS growth 2% exceeds 1%')),
  );
  assert.ok(existsSync(join(dir, 'soak-summary.json')));

  (child_process as any).execSync = originalExec;
  exitMock.mock.restore();
  delete process.env.SOAK_THROUGHPUT_MIN;
});
