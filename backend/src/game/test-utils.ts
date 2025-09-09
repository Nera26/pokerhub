export const state = {
  phase: 'DEAL',
  street: 'preflop',
  pot: 0,
  sidePots: [],
  currentBet: 0,
  players: [
    {
      id: 'u1',
      stack: 1000,
      folded: false,
      bet: 0,
      allIn: false,
      holeCards: [1, 2],
    },
    {
      id: 'u2',
      stack: 1000,
      folded: false,
      bet: 0,
      allIn: false,
      holeCards: [3, 4],
    },
  ],
  deck: [],
  communityCards: [],
} as any;

export function expectedState(viewerId: string) {
  const players = state.players.map((p) => {
    if (p.id === viewerId) return p;
    const { holeCards, ...rest } = p;
    return rest;
  });
  return {
    version: '1',
    tick: 1,
    phase: state.phase,
    street: state.street,
    pot: state.pot,
    sidePots: state.sidePots,
    currentBet: state.currentBet,
    players,
    communityCards: state.communityCards,
  };
}
