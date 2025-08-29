import { appendFileSync, mkdirSync } from 'fs';
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
  private commitment?: string;
  private proof?: HandProof;

  constructor(handId?: string, commitment?: string) {
    if (handId) {
      const dir = join(process.cwd(), '../storage/hand-logs');
      mkdirSync(dir, { recursive: true });
      this.filePath = join(dir, `${handId}.jsonl`);
    }
    if (commitment) this.recordCommitment(commitment);
  }

  private appendLine(obj: unknown) {
    if (this.filePath) {
      appendFileSync(this.filePath, `${JSON.stringify(obj)}\n`);
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
    this.appendLine(entry);
  }

  recordCommitment(commitment: string) {
    this.commitment = commitment;
    this.appendLine({ commitment });
  }

  recordProof(proof: HandProof) {
    this.proof = structuredClone(proof);
    this.appendLine({ proof: this.proof });
  }

  getAll(): HandLogEntry[] {
    return this.entries.map((e) => structuredClone(e));
  }

  getCommitment() {
    return this.commitment;
  }

  getProof(): HandProof | undefined {
    return this.proof ? structuredClone(this.proof) : undefined;
  }

  reconstruct(index: number): GameState | undefined {
    const entry = this.entries[index];
    return entry ? structuredClone(entry[3]) : undefined;
  }
}
