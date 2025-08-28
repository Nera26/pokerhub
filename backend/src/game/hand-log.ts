import { appendFileSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
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
  private readonly filePath?: string;

  constructor(tableId?: string) {
    if (tableId) {
      const dir = join(process.cwd(), '../storage/hand-logs');
      mkdirSync(dir, { recursive: true });
      this.filePath = join(dir, `${tableId}.jsonl`);
    }
  }

  private append(entry: HandLogEntry) {
    if (this.filePath) {
      appendFileSync(this.filePath, `${JSON.stringify(entry)}\n`);
    }
  }

  record(action: GameAction, preState: GameState, postState: GameState) {
    const index = this.entries.length;
    const entry: HandLogEntry = [
      index,
      structuredClone(action),
      structuredClone(preState),
      structuredClone(postState),
    ];
    this.entries.push(entry);
    this.append(entry);
  }

  recordProof(proof: HandProof) {
    const last = this.entries[this.entries.length - 1];
    if (last) {
      last[4] = structuredClone(proof);
      if (this.filePath) {
        const lines = readFileSync(this.filePath, 'utf8')
          .trimEnd()
          .split('\n');
        lines[lines.length - 1] = JSON.stringify(last);
        writeFileSync(this.filePath, lines.join('\n') + '\n');
      }
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
