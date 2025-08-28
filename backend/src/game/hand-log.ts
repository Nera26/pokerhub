import { GameAction, GameState } from './state-machine';
import type { HandProof } from './rng';

// [index, action, preState, postState, proof]
export type HandLogEntry = [
  number,
  GameAction,
  GameState,
  GameState,
  HandProof?,
];

export class HandLog {
  private readonly entries: HandLogEntry[] = [];

  record(action: GameAction, preState: GameState, postState: GameState) {
    const index = this.entries.length;
    this.entries.push([
      index,
      structuredClone(action),
      structuredClone(preState),
      structuredClone(postState),
    ]);
  }

  recordProof(proof: HandProof) {
    const last = this.entries[this.entries.length - 1];
    if (last) {
      last[4] = structuredClone(proof);
    }
  }

  getAll(): HandLogEntry[] {
    return this.entries.map((e) => structuredClone(e));
  }

  reconstruct(index: number): GameState | undefined {
    const entry = this.entries[index];
    return entry ? structuredClone(entry[3]) : undefined;
  }
}
