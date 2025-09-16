export interface Session {
  playerId: string;
  ip: string;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export interface BetEvent {
  handId: string;
  playerId: string;
  timeMs: number;
}

export interface SharedIpResult {
  ip: string;
  players: string[];
}

export interface SynchronizedBettingResult {
  handId: string;
  players: string[];
}

export function detectSharedIP(sessions: Session[]): SharedIpResult[] {
  const map = new Map<string, Set<string>>();
  for (const s of sessions) {
    if (!map.has(s.ip)) map.set(s.ip, new Set());
    map.get(s.ip)!.add(s.playerId);
  }
  const results: SharedIpResult[] = [];
  for (const [ip, players] of map.entries()) {
    if (players.size > 1) {
      results.push({ ip, players: Array.from(players) });
    }
  }
  return results;
}

export function clusterBySharedValues(
  userValues: Record<string, string[]>,
): Record<string, string[]> {
  const groups: Record<string, Set<string>> = {};
  for (const [user, values] of Object.entries(userValues)) {
    for (const value of values) {
      groups[value] ??= new Set();
      groups[value]!.add(user);
    }
  }
  return Object.fromEntries(
    Object.entries(groups)
      .filter(([, set]) => set.size > 1)
      .map(([k, set]) => [k, Array.from(set)]),
  );
}

export function detectChipDump(transfers: Transfer[]): number {
  const balances: Record<string, number> = {};
  for (const t of transfers) {
    balances[t.from] = (balances[t.from] || 0) - t.amount;
    balances[t.to] = (balances[t.to] || 0) + t.amount;
  }
  const imbalances = Object.values(balances).map((b) => Math.abs(b));
  const total = imbalances.reduce((a, b) => a + b, 0);
  return total ? Math.max(...imbalances) / total : 0;
}

export function detectSynchronizedBetting(
  events: BetEvent[],
  windowMs = 200,
): SynchronizedBettingResult[] {
  const byHand = new Map<string, BetEvent[]>();
  for (const e of events) {
    if (!byHand.has(e.handId)) byHand.set(e.handId, []);
    byHand.get(e.handId)!.push(e);
  }
  const results: SynchronizedBettingResult[] = [];
  for (const [handId, list] of byHand.entries()) {
    const times = list.map((e) => e.timeMs).sort((a, b) => a - b);
    if (times.length > 1 && times[times.length - 1] - times[0] <= windowMs) {
      results.push({ handId, players: list.map((e) => e.playerId) });
    }
  }
  return results;
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

function averageDiffSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff += Math.abs(a[i] - b[i]);
  }
  const avgDiff = diff / a.length;
  return 1 / (1 + avgDiff);
}

export function calculateTimingSimilarity(
  timesA: number[],
  timesB: number[],
): number {
  return averageDiffSimilarity(timesA, timesB);
}

export function calculateSeatProximity(
  seatsA: number[],
  seatsB: number[],
): number {
  return averageDiffSimilarity(seatsA, seatsB);
}

export function timeCorrelatedBetting(
  timesA: number[],
  timesB: number[],
  windowMs = 1000,
): number {
  if (!timesA.length || !timesB.length) return 0;
  let matches = 0;
  for (const tA of timesA) {
    if (timesB.some((tB) => Math.abs(tA - tB) <= windowMs)) {
      matches++;
    }
  }
  return matches / Math.max(timesA.length, timesB.length);
}

