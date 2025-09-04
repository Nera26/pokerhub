export interface RakeRule {
  percent: number;
  cap: number;
}

function loadConfig(): Record<string, RakeRule> {
  try {
    return JSON.parse(process.env.RAKE_CONFIG ?? '{}');
  } catch {
    return {};
  }
}

const RAKE_TABLE: Record<string, RakeRule> = loadConfig();

export function getRakeRule(stake: string): RakeRule {
  return RAKE_TABLE[stake] ?? { percent: 0, cap: 0 };
}

export function resolveRake(totalPot: number, stake: string): number {
  const { percent, cap } = getRakeRule(stake);
  const rake = Math.floor(totalPot * percent);
  return Math.min(rake, cap);
}
