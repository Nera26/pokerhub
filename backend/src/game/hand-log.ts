import { GameAction, GameState } from './state-machine';

// [index, action, preState, postState]
export type HandLogEntry = [number, GameAction, GameState, GameState];

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

  getAll(): HandLogEntry[] {
    return this.entries.map((e) => structuredClone(e));
  }

  reconstruct(index: number): GameState | undefined {
    const entry = this.entries[index];
    return entry ? structuredClone(entry[3]) : undefined;
  }
}
