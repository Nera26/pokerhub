import type { SoakStats, SoakLimits } from '../lib/soakMetrics.ts';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkSoakStats } = require('../lib/soakMetrics.ts');

test('passes when metrics within limits', () => {
  const stats: SoakStats = { gcPauseP95Ms: 40, rssGrowthPct: 0.5 };
  const limits: SoakLimits = { maxGcPauseMs: 50, maxRssGrowthPct: 1 };
  assert.equal(checkSoakStats(stats, limits).length, 0);
});

test('fails when GC pause exceeds limit', () => {
  const stats: SoakStats = { gcPauseP95Ms: 60, rssGrowthPct: 0.5 };
  const limits: SoakLimits = { maxGcPauseMs: 50, maxRssGrowthPct: 1 };
  const regressions = checkSoakStats(stats, limits);
  assert.equal(regressions.length, 1);
  assert.match(regressions[0].message, /GC pause p95 60ms/);
});

test('fails when RSS growth exceeds limit', () => {
  const stats: SoakStats = { gcPauseP95Ms: 40, rssGrowthPct: 2 };
  const limits: SoakLimits = { maxGcPauseMs: 50, maxRssGrowthPct: 1 };
  const regressions = checkSoakStats(stats, limits);
  assert.equal(regressions.length, 1);
  assert.match(regressions[0].message, /RSS growth 2%/);
});
