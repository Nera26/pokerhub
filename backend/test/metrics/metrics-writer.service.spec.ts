import { MetricsWriterService } from '../../src/metrics/metrics-writer.service';
import { createInMemoryRedis, MockRedis } from '../utils/mock-redis';

describe('MetricsWriterService', () => {
  let redis: MockRedis;
  let service: MetricsWriterService;

  beforeEach(() => {
    ({ redis } = createInMemoryRedis());
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

  it('records web vital samples with trimming', async () => {
    await service.recordWebVital({
      name: 'LCP',
      value: 2400,
      overThreshold: false,
    });
    const entries = await redis.lrange('metrics:web-vitals:lcp', 0, -1);
    expect(entries).toHaveLength(1);
    const sample = JSON.parse(entries[0]) as {
      value: number;
      overThreshold: boolean;
      recordedAt: number;
    };
    expect(sample).toMatchObject({ value: 2400, overThreshold: false });
    expect(typeof sample.recordedAt).toBe('number');
  });

  it('keeps only the most recent 50 web vital samples', async () => {
    for (let i = 0; i < 60; i++) {
      await service.recordWebVital({
        name: 'CLS',
        value: i / 100,
        overThreshold: i % 2 === 0,
      });
    }
    const entries = await redis.lrange('metrics:web-vitals:cls', 0, -1);
    expect(entries).toHaveLength(50);
    const newest = JSON.parse(entries[0]) as { value: number };
    const oldest = JSON.parse(entries[entries.length - 1]) as { value: number };
    expect(newest.value).toBe(0.59);
    expect(oldest.value).toBe(0.1);
  });
});
