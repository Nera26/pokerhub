import {
  sharedIp,
  chipDumpingScore,
  isLikelyCollusion,
  PlayerSession,
  Transfer,
} from '../../src/analytics/collusion';

describe('collusion heuristics', () => {
  it('detects shared IPs', () => {
    const a: PlayerSession = { userId: 'u1', ips: ['1.1.1.1'] };
    const b: PlayerSession = { userId: 'u2', ips: ['2.2.2.2', '1.1.1.1'] };
    expect(sharedIp(a, b)).toBe(true);
  });

  it('computes chip dumping score', () => {
    const transfers: Transfer[] = [
      { from: 'u1', to: 'u2', amount: 100 },
      { from: 'u1', to: 'u2', amount: 50 },
    ];
    expect(chipDumpingScore(transfers)).toBeGreaterThan(0.4);
  });

  it('flags collusion with shared IP and chip dumping', () => {
    const a: PlayerSession = { userId: 'u1', ips: ['1.1.1.1'] };
    const b: PlayerSession = { userId: 'u2', ips: ['1.1.1.1'] };
    const transfers: Transfer[] = [{ from: 'u1', to: 'u2', amount: 200 }];
    expect(isLikelyCollusion(a, b, transfers)).toBe(true);
  });

  it('does not flag when no indicators', () => {
    const a: PlayerSession = { userId: 'u1', ips: ['1.1.1.1'] };
    const b: PlayerSession = { userId: 'u2', ips: ['2.2.2.2'] };
    expect(isLikelyCollusion(a, b, [])).toBe(false);
  });
});
