import { detectSharedIP, detectChipDumping, detectSynchronizedBetting } from "./anti_collusion/heuristics.js";

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

export interface AntiCollusionReport {
  sharedIPs: ReturnType<typeof detectSharedIP>;
  chipDumping: ReturnType<typeof detectChipDumping>;
  synchronizedBetting: ReturnType<typeof detectSynchronizedBetting>;
}

export function analyzeCollusion(data: {
  sessions: Session[];
  transfers: Transfer[];
  events: BetEvent[];
}): AntiCollusionReport {
  return {
    sharedIPs: detectSharedIP(data.sessions),
    chipDumping: detectChipDumping(data.transfers),
    synchronizedBetting: detectSynchronizedBetting(data.events),
  };
}

