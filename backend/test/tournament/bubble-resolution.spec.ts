import { TournamentService } from '../../src/tournament/tournament.service';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';

describe('Bubble resolution', () => {
  const service = new TournamentService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { get: jest.fn() } as any,
    new RebuyService(),
    new PkoService(),
  );

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
