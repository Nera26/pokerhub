import { RevenueService } from '../../src/wallet/revenue.service';
import type { ConfigService } from '@nestjs/config';

describe('RevenueService', () => {
  it('computes percentages', async () => {
    const now = new Date();
    const repo = {
      find: jest.fn().mockResolvedValue([
        { amount: 100, type: { label: 'Cash' }, createdAt: now },
        { amount: 100, type: { label: 'Tournaments' }, createdAt: now },
      ]),
    } as any;
    const config = { get: jest.fn().mockReturnValue('eur') } as unknown as ConfigService;
    const service = new RevenueService(repo, config);
    const res = await service.getBreakdown('all');
    expect(res).toEqual({
      currency: 'EUR',
      streams: [
        { label: 'Cash', pct: 50, value: 100 },
        { label: 'Tournaments', pct: 50, value: 100 },
      ],
    });
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
    const config = { get: jest.fn().mockReturnValue('usd') } as unknown as ConfigService;
    const service = new RevenueService(repo, config);
    const res = await service.getBreakdown('week');
    expect(res).toEqual({
      currency: 'USD',
      streams: [{ label: 'Recent', pct: 100, value: 100 }],
    });
  });
});
