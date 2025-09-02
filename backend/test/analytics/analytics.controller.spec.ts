import { AnalyticsController } from '../../src/analytics/analytics.controller';
import type { AnalyticsService } from '../../src/analytics/analytics.service';

describe('AnalyticsController', () => {
  it('returns audit summary', async () => {
    const service = {
      getAuditSummary: jest.fn().mockResolvedValue({
        total: 10,
        errors: 2,
        logins: 5,
      }),
    } as unknown as AnalyticsService;
    const controller = new AnalyticsController(service);
    await expect(controller.summary()).resolves.toEqual({
      total: 10,
      errors: 2,
      logins: 5,
    });
    expect(service.getAuditSummary).toHaveBeenCalled();
  });
});

