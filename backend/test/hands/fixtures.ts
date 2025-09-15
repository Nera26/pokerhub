import { writeHandLog } from './hand-test-utils';

export const pre = {
  phase: 'BETTING_ROUND',
  street: 'preflop',
  pot: 0,
  sidePots: [] as any[],
  currentBet: 0,
  players: [
    { id: 'u1', stack: 100, folded: false, bet: 0, allIn: false },
  ],
  deck: [],
  communityCards: [],
};

export const post = {
  phase: 'BETTING_ROUND',
  street: 'preflop',
  pot: 10,
  sidePots: [] as any[],
  currentBet: 10,
  players: [
    { id: 'u1', stack: 90, folded: false, bet: 10, allIn: false },
  ],
  deck: [],
  communityCards: [],
};

export function buildHandLog(handId: string, preState = pre, postState = post) {
  writeHandLog(handId, [0, { type: 'start' }, preState, postState]);
}
