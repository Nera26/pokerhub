/**
 * Legacy collusion detection heuristics from the 2021 analytics prototype.
 * Archived for historical reference after the 2024 pipeline overhaul.
 */
import { detectChipDump } from '../../shared/analytics/collusion';

interface PlayerSession {
  userId: string;
  ips: string[];
}

interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export function sharedIp(a: PlayerSession, b: PlayerSession): boolean {
  return a.ips.some((ip) => b.ips.includes(ip));
}

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
