import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPerfMetrics, LatencyHist, TableMetrics, PerfThresholds } from '../verify-perf.ts';

test('passes when metrics within limits', () => {
  const hist: LatencyHist = { p50: 10, p95: 20, p99: 30 };
  const tables: TableMetrics = { averageActionsPerMin: 200, tables: { '1': { p50: 10, p95: 20, p99: 30, actionsPerMin: 200 } } };
  const limits: PerfThresholds = { ackP50Ms: 40, ackP95Ms: 120, ackP99Ms: 200, tpsMin: 150 };
  checkPerfMetrics(hist, tables, limits);
});

test('fails when latency exceeds limit', () => {
  const hist: LatencyHist = { p50: 10, p95: 130, p99: 30 };
  const tables: TableMetrics = { averageActionsPerMin: 200, tables: {} };
  const limits: PerfThresholds = { ackP50Ms: 40, ackP95Ms: 120, ackP99Ms: 200, tpsMin: 150 };
  assert.throws(() => checkPerfMetrics(hist, tables, limits), /latency p95 130/);
});

test('fails when throughput below limit', () => {
  const hist: LatencyHist = { p50: 10, p95: 20, p99: 30 };
  const tables: TableMetrics = { averageActionsPerMin: 100, tables: {} };
  const limits: PerfThresholds = { ackP50Ms: 40, ackP95Ms: 120, ackP99Ms: 200, tpsMin: 150 };
  assert.throws(() => checkPerfMetrics(hist, tables, limits), /throughput 100/);
});
