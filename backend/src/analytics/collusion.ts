import { detectChipDump } from './collusion.model';

export interface PlayerSession {
  userId: string;
  ips: string[];
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

export function sharedIp(a: PlayerSession, b: PlayerSession): boolean {
  return a.ips.some((ip) => b.ips.includes(ip));
}

export function chipDumpingScore(transfers: Transfer[]): number {
  return detectChipDump(transfers);
}

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
