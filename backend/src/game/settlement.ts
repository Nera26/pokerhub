export interface SettlementEntry {
  playerId: string;
  delta: number;
}

export class SettlementJournal {
  private readonly entries: SettlementEntry[] = [];

  record(entry: SettlementEntry) {
    this.entries.push(entry);
  }

  getAll(): SettlementEntry[] {
    return [...this.entries];
  }
}

// --- New settlement helpers -------------------------------------------------

import type { GameStateInternal } from './state-machine';
import { settlePots as sharedSettlePots } from '@shared/poker/sidePots';

// Re-export shared settlement logic for callers within the backend
export const settlePots = (state: GameStateInternal): void => {
  sharedSettlePots(state as any);
};

/**
 * Record stack deltas against their initial values into the journal.
 * Returns the recorded entries for further processing.
 */
export function recordDeltas(
  state: GameStateInternal,
  initial: Map<string, number>,
  journal: SettlementJournal,
): SettlementEntry[] {
  const entries: SettlementEntry[] = [];
  for (const player of state.players) {
    const start = initial.get(player.id) ?? 0;
    const delta = player.stack - start;
    const entry = { playerId: player.id, delta };
    journal.record(entry);
    entries.push(entry);
  }
  return entries;
}

