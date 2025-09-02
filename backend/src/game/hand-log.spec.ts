import { HandLog } from './hand-log';
import { GameAction, GameStateInternal } from './state-machine';
import type { HandProof } from './rng';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('HandLog', () => {
  it('reconstructs state by action index', () => {
    const log = new HandLog();

    const basePlayers = [
      { id: 'A', stack: 100, folded: false, bet: 0, allIn: false },
      { id: 'B', stack: 100, folded: false, bet: 0, allIn: false },
    ];

    const s0: GameStateInternal = {
      phase: 'BETTING_ROUND',
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players: structuredClone(basePlayers),
      deck: [],
      communityCards: [],
    };

    const a1: GameAction = { type: 'bet', playerId: 'A', amount: 5 };
    const s1: GameStateInternal = structuredClone(s0);
    s1.players[0].stack -= 5;
    s1.players[0].bet = 5;
    s1.pot = 5;
    s1.currentBet = 5;

    const a2: GameAction = { type: 'call', playerId: 'B', amount: 5 };
    const s2: GameStateInternal = structuredClone(s1);
    s2.players[1].stack -= 5;
    s2.players[1].bet = 5;
    s2.pot = 10;

    log.record(a1, s0, s1);
    log.record(a2, s1, s2);

    expect(log.reconstruct(0)).toEqual(s1);
    expect(log.reconstruct(1)).toEqual(s2);
  });

  it('writes entries asynchronously to jsonl file', async () => {
    const handId = 'spec-hand';
    const path = join(process.cwd(), '../storage/hand-logs', `${handId}.jsonl`);
    if (existsSync(path)) unlinkSync(path);
    const log = new HandLog(handId, 'c');
    const s0: GameStateInternal = {
      phase: 'BETTING_ROUND',
      street: 'preflop',
      pot: 0,
      sidePots: [],
      currentBet: 0,
      players: [],
      deck: [],
      communityCards: [],
    };
    const action: GameAction = { type: 'check', playerId: 'A' };
    log.record(action, s0, s0);
    const proof: HandProof = { seed: 's', nonce: 'n', commitment: 'c' };
    log.recordProof(proof);
    expect(existsSync(path)).toBe(false);
    await log.flush();
    const lines = readFileSync(path, 'utf8').trim().split('\n');
    expect(lines).toEqual([
      JSON.stringify({ commitment: 'c' }),
      JSON.stringify([0, action, s0, s0]),
      JSON.stringify({ proof }),
    ]);
    unlinkSync(path);
  });
});
