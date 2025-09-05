/**
 * @deprecated This snippet shows early collusion-detection heuristics.
 * It originated in `docs/archive/analytics-collusion.ts` as part of the
 * 2021 analytics prototype, moved to `docs/deprecated` after the 2024 pipeline
 * overhaul, and now lives in `/deprecated` for long-term reference.
 */
import { detectChipDump } from '../shared/analytics/collusion';

interface PlayerSession {
  userId: string;
  ips: string[];
}

interface Transfer {
  from: string;
  to: string;
  amount: number;
}

/**
 * @deprecated Legacy collusion heuristics retained for reference.
 */
export function sharedIp(a: PlayerSession, b: PlayerSession): boolean {
  return a.ips.some((ip) => b.ips.includes(ip));
}

/**
 * @deprecated Legacy collusion heuristic retained for reference.
 */
export function isLikelyCollusion(
  a: PlayerSession,
  b: PlayerSession,
  transfers: Transfer[],
  chipDumpThreshold = 0.8,
): boolean {
  const shared = sharedIp(a, b);
  const dumpScore = detectChipDump(transfers);
  return shared || dumpScore >= chipDumpThreshold;
}
