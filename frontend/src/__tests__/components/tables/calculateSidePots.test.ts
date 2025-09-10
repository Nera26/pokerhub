import { calculateSidePots } from '@shared/poker/sidePots';
import type { Player } from '@/app/components/tables/types';

const makePlayer = (id: number, committed: number): Player => ({
  id,
  username: `P${id}`,
  avatar: '',
  chips: 0,
  committed,
});

describe('calculateSidePots', () => {
  it('returns no side pots when commitments are equal', () => {
    const players = [makePlayer(1, 50), makePlayer(2, 50), makePlayer(3, 50)];
    const { main, sidePots } = calculateSidePots(players, 150);
    expect(main).toBe(150);
    expect(sidePots).toEqual([]);
  });

  it('calculates a single side pot', () => {
    const players = [makePlayer(1, 50), makePlayer(2, 100), makePlayer(3, 100)];
    const { main, sidePots } = calculateSidePots(players, 250);
    expect(main).toBe(150);
    expect(sidePots).toEqual([100]);
  });

  it('calculates multiple side pots', () => {
    const players = [
      makePlayer(1, 50),
      makePlayer(2, 100),
      makePlayer(3, 150),
      makePlayer(4, 150),
    ];
    const { main, sidePots } = calculateSidePots(players, 450);
    expect(main).toBe(200);
    expect(sidePots).toEqual([150, 100]);
  });
});
