export interface SoakStats {
  gcPauseP95Ms: number;
  rssGrowthPct: number;
}

export interface SoakLimits {
  maxGcPauseMs: number;
  maxRssGrowthPct: number;
}

export interface Regression {
  level: 'critical' | 'warning';
  message: string;
}

export function parseLimitsFromEnv(env = process.env): SoakLimits {
  return {
    maxGcPauseMs: Number(env.SOAK_GC_P95_MS || 50),
    maxRssGrowthPct: Number(env.SOAK_RSS_GROWTH_PCT || 1),
  };
}

export function checkSoakStats(stats: SoakStats, limits: SoakLimits): Regression[] {
  const regressions: Regression[] = [];
  if (stats.rssGrowthPct > limits.maxRssGrowthPct)
    regressions.push({
      level: 'critical',
      message: `RSS growth ${stats.rssGrowthPct}% exceeds ${limits.maxRssGrowthPct}%`,
    });
  if (stats.gcPauseP95Ms > limits.maxGcPauseMs)
    regressions.push({
      level: 'critical',
      message: `GC pause p95 ${stats.gcPauseP95Ms}ms exceeds ${limits.maxGcPauseMs}ms`,
    });
  return regressions;
}
