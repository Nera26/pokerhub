import { TournamentService } from '../../src/tournament/tournament.service';
import { RebuyService } from '../../src/tournament/rebuy.service';
import { PkoService } from '../../src/tournament/pko.service';
import { icmRaw } from '@shared/utils/icm';

describe('tournament structure payouts', () => {
  const service = new TournamentService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    new RebuyService(),
    new PkoService(),
    { get: jest.fn().mockResolvedValue(true) } as any,
  );

  it('computes freezeout payouts via ICM with <1 chip error', () => {
    const stacks = [5000, 3000, 2000];
    const prizes = [500, 300, 200];
    const res = service.calculatePrizes(1000, prizes, {
      method: 'icm',
      stacks,
    });
    const expected = icmRaw(stacks, prizes);
    for (let i = 0; i < stacks.length; i++) {
      expect(Math.abs(res.prizes[i] - expected[i])).toBeLessThan(1);
    }
    expect(res.prizes.reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it('computes PKO payouts and bounty pool', () => {
    const stacks = [5000, 3000, 2000];
    const prizes = [400, 240, 160];
    const res = service.calculatePrizes(1000, prizes, {
      method: 'icm',
      stacks,
      bountyPct: 0.2,
    });
    expect(res.bountyPool).toBe(200);
    const expected = icmRaw(stacks, prizes);
    for (let i = 0; i < stacks.length; i++) {
      expect(Math.abs(res.prizes[i] - expected[i])).toBeLessThan(1);
    }
    expect(res.prizes.reduce((a, b) => a + b, 0) + (res.bountyPool ?? 0)).toBe(1000);
  });

  it('computes satellite payouts with seats and remainder', () => {
    const stacks = [6000, 4000];
    const prizes = [30, 20];
    const res = service.calculatePrizes(1300, prizes, {
      method: 'icm',
      stacks,
      satelliteSeatCost: 250,
    });
    expect(res.seats).toBe(5);
    expect(res.remainder).toBe(0);
    const expected = icmRaw(stacks, prizes);
    for (let i = 0; i < stacks.length; i++) {
      expect(Math.abs(res.prizes[i] - expected[i])).toBeLessThan(1);
    }
    expect(res.prizes.reduce((a, b) => a + b, 0) + res.seats! * 250).toBe(1300);
  });

  it('handles re-entry and late registration in payouts', async () => {
    const stacks = [5000, 5000];
    let prizePool = 100;
    // player re-enters
    expect(await service.canRebuy(0, 1000)).toBe(true);
    const { stack: reEntryStack, prizeContribution } = service.applyRebuy(0, 1000, 50);
    prizePool += prizeContribution;
    stacks.push(reEntryStack);
    // late registration entrant
    stacks.push(1000);
    prizePool += 50;
    const prizes = [prizePool * 0.6, prizePool * 0.4];
    const res = service.calculatePrizes(prizePool, prizes, {
      method: 'icm',
      stacks,
    });
    const expected = icmRaw(stacks, prizes);
    for (let i = 0; i < stacks.length; i++) {
      expect(Math.abs(res.prizes[i] - expected[i])).toBeLessThan(1);
    }
  });

  it('resolves bubble payouts with odd chip to larger stacks', () => {
    const busts = [
      { id: 'a', stack: 5000 },
      { id: 'b', stack: 3000 },
      { id: 'c', stack: 2000 },
    ];
    const prizes = [100, 60, 30];
    const res = service.resolveBubbleElimination(busts, prizes);
    expect(res).toEqual([
      { id: 'a', prize: 64 },
      { id: 'b', prize: 63 },
      { id: 'c', prize: 63 },
    ]);
  });
});

