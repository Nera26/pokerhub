import { chipDumpingScore, PlayerSession, Transfer } from '../collusion';

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
  const dumpScore = chipDumpingScore(transfers);
  return shared || dumpScore >= chipDumpThreshold;
}
