import {
  detectSharedIP,
  detectChipDump,
  detectSynchronizedBetting,
} from "../shared/analytics/collusion";
import type { Session, Transfer, BetEvent } from "../shared/analytics";

export interface AntiCollusionReport {
  sharedIPs: ReturnType<typeof detectSharedIP>;
  chipDumping: ReturnType<typeof detectChipDump>;
  synchronizedBetting: ReturnType<typeof detectSynchronizedBetting>;
}

export function analyzeCollusion(data: {
  sessions: Session[];
  transfers: Transfer[];
  events: BetEvent[];
}): AntiCollusionReport {
  return {
    sharedIPs: detectSharedIP(data.sessions),
    chipDumping: detectChipDump(data.transfers),
    synchronizedBetting: detectSynchronizedBetting(data.events),
  };
}

