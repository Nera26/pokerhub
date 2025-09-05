import { createWriteStream, mkdirSync, WriteStream } from 'fs';
import { once } from 'events';
import { join } from 'path';
import { GameAction, GameStateInternal } from './state-machine';
import type { HandProof } from '@shared/types';

// [index, action, preState, postState, proof]
export type HandLogEntry = [
  number,
  GameAction,
  GameStateInternal,
  GameStateInternal,
  HandProof?,
];

export class HandLog {
  private readonly entries: HandLogEntry[] = [];
  private readonly filePath?: string;
  private stream?: WriteStream;
  private pending: Promise<void> = Promise.resolve();
  private commitment?: string;
  private proof?: HandProof;

  constructor(handId?: string, commitment?: string) {
    if (handId) {
      const dir = join(process.cwd(), '../storage/hand-logs');
      mkdirSync(dir, { recursive: true });
      this.filePath = join(dir, `${handId}.jsonl`);
      this.stream = createWriteStream(this.filePath, { flags: 'a' });
      process.on('beforeExit', () => {
        void this.flush();
      });
    }
    if (commitment) this.recordCommitment(commitment);
  }

  private appendLine(obj: unknown) {
    if (!this.stream) return;
    const line = `${JSON.stringify(obj)}\n`;
    this.pending = this.pending.then(async () => {
      if (!this.stream!.write(line)) {
        await once(this.stream!, 'drain');
      }
    });
  }

  record(
    action: GameAction,
    preState: GameStateInternal,
    postState: GameStateInternal,
  ) {
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

  async flush() {
    if (!this.stream) return;
    await this.pending;
    await new Promise<void>((resolve, reject) => {
      this.stream!.end((err) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      });
    });
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

  getCommitmentAndProof() {
    return {
      commitment: this.commitment,
      proof: this.proof ? structuredClone(this.proof) : undefined,
    };
  }

  reconstruct(index: number): GameStateInternal | undefined {
    const entry = this.entries[index];
    return entry ? structuredClone(entry[3]) : undefined;
  }
}
