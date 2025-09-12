import { MetricsWriterService } from '../../src/metrics/metrics-writer.service';
import { MockRedis } from '../utils/mock-redis';

describe('MetricsWriterService', () => {
  let redis: MockRedis;
  let service: MetricsWriterService;

  beforeEach(() => {
    redis = new MockRedis();
    service = new MetricsWriterService(redis as any);
  });

  it('records unique logins within a sliding window', async () => {
    await service.recordLogin('u1');
    expect(await redis.get('metrics:online')).toBe('1');
    // duplicate login should not increase count
    await service.recordLogin('u1');
    expect(await redis.get('metrics:online')).toBe('1');
    await service.recordLogin('u2');
    expect(await redis.get('metrics:online')).toBe('2');
  });

  it('accumulates revenue', async () => {
    await service.addRevenue(10);
    await service.addRevenue(2.5);
    expect(await redis.get('metrics:revenue')).toBe('12.5');
  });
});
