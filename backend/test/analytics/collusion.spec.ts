import { detectChipDump, Transfer } from '@shared/analytics/collusion';

describe('collusion heuristics', () => {
  it('computes chip dumping score', () => {
    const transfers: Transfer[] = [
      { from: 'u1', to: 'u2', amount: 100 },
      { from: 'u1', to: 'u2', amount: 50 },
    ];
    expect(detectChipDump(transfers)).toBeGreaterThan(0.4);
  });
});
