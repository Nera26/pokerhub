export interface CollusionFeatures {
  vpipCorrelation: number;
  chipDumpScore: number;
  timingSimilarity: number;
}

export function calculateVpipCorrelation(vpipA: number[], vpipB: number[]): number {
  if (vpipA.length !== vpipB.length || vpipA.length === 0) {
    return 0;
  }
  const n = vpipA.length;
  const meanA = vpipA.reduce((a, b) => a + b, 0) / n;
  const meanB = vpipB.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < n; i++) {
    const da = vpipA[i] - meanA;
    const db = vpipB[i] - meanB;
    numerator += da * db;
    denomA += da * da;
    denomB += db * db;
  }
  return denomA && denomB ? numerator / Math.sqrt(denomA * denomB) : 0;
}

export function detectChipDump(
  transfers: { from: string; to: string; amount: number }[],
): number {
  const balances: Record<string, number> = {};
  for (const t of transfers) {
    balances[t.from] = (balances[t.from] || 0) - t.amount;
    balances[t.to] = (balances[t.to] || 0) + t.amount;
  }
  const imbalances = Object.values(balances).map((b) => Math.abs(b));
  const total = imbalances.reduce((a, b) => a + b, 0);
  return total ? Math.max(...imbalances) / total : 0;
}

export function calculateTimingSimilarity(timesA: number[], timesB: number[]): number {
  if (timesA.length !== timesB.length || timesA.length === 0) {
    return 0;
  }
  let diff = 0;
  for (let i = 0; i < timesA.length; i++) {
    diff += Math.abs(timesA[i] - timesB[i]);
  }
  const avgDiff = diff / timesA.length;
  return 1 / (1 + avgDiff);
}

export function buildCollusionFeatures(
  vpipA: number[],
  vpipB: number[],
  transfers: { from: string; to: string; amount: number }[],
  timesA: number[],
  timesB: number[],
): CollusionFeatures {
  return {
    vpipCorrelation: calculateVpipCorrelation(vpipA, vpipB),
    chipDumpScore: detectChipDump(transfers),
    timingSimilarity: calculateTimingSimilarity(timesA, timesB),
  };
}
