import { BroadcastsService } from '../../src/messaging/broadcasts.service';

import { setupBroadcasts, BroadcastsTestContext } from './broadcasts.test-utils';

describe('BroadcastsService', () => {
  let service: BroadcastsService;
  let ctx: BroadcastsTestContext;

  beforeAll(async () => {
    ctx = await setupBroadcasts();
    service = ctx.service;
  });

  afterAll(async () => {
    await ctx.app.close();
    await ctx.repos.dataSource.destroy();
  });

  it('persists broadcasts', async () => {
    await service.send({
      type: 'announcement',
      text: 'Hello',
      urgent: false,
      sound: true,
    });
    const list = await service.list();
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe('Hello');
  });

  it('lists types', async () => {
    const types = await service.listTypes();
    expect(types).toEqual({
      announcement: { icon: '📢', color: 'text-accent-yellow' },
      alert: { icon: '⚠️', color: 'text-danger-red' },
      notice: { icon: 'ℹ️', color: 'text-accent-blue' },
    });
  });

  it('lists templates from database', async () => {
    const templates = await service.listTemplates();
    expect(templates).toEqual({
      maintenance:
        'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
      tournament:
        'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!',
    });
  });
});
