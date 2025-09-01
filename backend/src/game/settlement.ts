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
import { evaluateHand } from './hand-evaluator';

/**
 * Distribute all pots in the given state to the appropriate winners.
 * Mutates player stacks and clears the pot/sidePots collections.
 */
export function settlePots(state: GameStateInternal): void {
  const active = state.players.filter((p) => !p.folded);
  if (active.length === 0) return;

  const board = state.communityCards ?? [];
  const scores = new Map<string, number>();
  for (const p of active) {
    const hole: number[] = (p as any).holeCards ?? [];
    let score = 0;
    try {
      score = evaluateHand([...hole, ...board]);
    } catch {
      score = 0;
    }
    scores.set(p.id, score);
  }

  const pots =
    state.sidePots.length > 0
      ? [...state.sidePots]
      : [
          {
            amount: state.pot,
            players: active.map((p) => p.id),
            contributions: Object.fromEntries(active.map((p) => [p.id, 0])),
          },
        ];

  for (const pot of pots) {
    const contenders = active.filter((p) => pot.players.includes(p.id));
    if (contenders.length === 0) continue;

    const best = Math.max(...contenders.map((p) => scores.get(p.id)!));
    const winners = contenders.filter((p) => scores.get(p.id) === best);
    const share = Math.floor(pot.amount / winners.length);

    for (const w of winners) w.stack += share;

    const remainder = pot.amount - share * winners.length;
    if (remainder > 0) winners[0].stack += remainder;
  }

  state.pot = 0;
  state.sidePots = [];
}

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

