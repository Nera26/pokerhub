import { RevenueService } from '../../src/wallet/revenue.service';

describe('RevenueService', () => {
  it('computes percentages', async () => {
    const now = new Date();
    const repo = {
      find: jest.fn().mockResolvedValue([
        { amount: 100, type: { label: 'Cash' }, createdAt: now },
        { amount: 100, type: { label: 'Tournaments' }, createdAt: now },
      ]),
    } as any;
    const service = new RevenueService(repo);
    const res = await service.getBreakdown('all');
    expect(res).toEqual([
      { label: 'Cash', pct: 50, value: 100 },
      { label: 'Tournaments', pct: 50, value: 100 },
    ]);
  });

  it('filters by range', async () => {
    const now = new Date();
    const old = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const repo = {
      find: jest.fn().mockResolvedValue([
        { amount: 100, type: { label: 'Recent' }, createdAt: now },
        { amount: 100, type: { label: 'Old' }, createdAt: old },
      ]),
    } as any;
    const service = new RevenueService(repo);
    const res = await service.getBreakdown('week');
    expect(res).toEqual([{ label: 'Recent', pct: 100, value: 100 }]);
  });
});
