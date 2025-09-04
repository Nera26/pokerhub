import {
  detectSharedIP,
  detectChipDumping,
  detectSynchronizedBetting,
} from "./anti_collusion/heuristics.js";
import type { Session, Transfer, BetEvent } from "../shared/analytics";

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

