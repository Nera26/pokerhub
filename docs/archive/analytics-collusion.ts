import { detectChipDump } from '../collusion';

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
