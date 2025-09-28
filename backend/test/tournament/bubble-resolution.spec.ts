import { createTournamentServiceInstance } from './helpers';

describe('Bubble resolution', () => {
  const service = createTournamentServiceInstance();

  it('awards odd chips to larger stacks', () => {
    const busts = [
      { id: 'a', stack: 5000 },
      { id: 'b', stack: 3000 },
    ];
    const res = service.resolveBubbleElimination(busts, [100, 51]);
    expect(res).toEqual([
      { id: 'a', prize: 76 },
      { id: 'b', prize: 75 },
    ]);
  });
});
