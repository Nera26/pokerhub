#!/usr/bin/env ts-node
import fs from 'fs';

export interface SoakStats {
  gcPauseP95Ms: number;
  rssGrowthPercent: number;
}

export interface SoakLimits {
  maxGcPauseMs: number;
  maxRssGrowthPct: number;
}

export function checkSoakStats(stats: SoakStats, limits: SoakLimits) {
  const errors: string[] = [];
  if (stats.rssGrowthPercent >= limits.maxRssGrowthPct)
    errors.push(`RSS growth ${stats.rssGrowthPercent}% exceeds ${limits.maxRssGrowthPct}%`);
  if (stats.gcPauseP95Ms > limits.maxGcPauseMs)
    errors.push(`GC pause p95 ${stats.gcPauseP95Ms}ms exceeds ${limits.maxGcPauseMs}ms`);
  if (errors.length) throw new Error(errors.join('; '));
}

export function main(file = 'gc-rss-stats.json'): void {
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as SoakStats;
  const limits: SoakLimits = {
    maxGcPauseMs: Number(process.env.SOAK_GC_P95_MS || 50),
    maxRssGrowthPct: Number(process.env.SOAK_RSS_GROWTH_PCT || 1),
  };
  checkSoakStats(data, limits);
}

if (require.main === module) {
  try {
    main(process.argv[2]);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

