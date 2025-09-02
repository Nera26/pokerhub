import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSoakStats, SoakStats, SoakLimits } from '../verify-soak-metrics.ts';

test('passes when metrics within limits', () => {
  const stats: SoakStats = { gcPauseP95Ms: 40, rssGrowthPercent: 0.5 };
  const limits: SoakLimits = { maxGcPauseMs: 50, maxRssGrowthPct: 1 };
  checkSoakStats(stats, limits);
});

test('fails when GC pause exceeds limit', () => {
  const stats: SoakStats = { gcPauseP95Ms: 60, rssGrowthPercent: 0.5 };
  const limits: SoakLimits = { maxGcPauseMs: 50, maxRssGrowthPct: 1 };
  assert.throws(() => checkSoakStats(stats, limits), /GC pause p95 60/);
});

test('fails when RSS growth exceeds limit', () => {
  const stats: SoakStats = { gcPauseP95Ms: 40, rssGrowthPercent: 2 };
  const limits: SoakLimits = { maxGcPauseMs: 50, maxRssGrowthPct: 1 };
  assert.throws(() => checkSoakStats(stats, limits), /RSS growth 2/);
});
