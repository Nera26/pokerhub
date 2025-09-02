import Redis from 'ioredis-mock';
import { FeatureFlagsService } from '../../src/feature-flags/feature-flags.service';

describe('FeatureFlagsService', () => {
  let redis: any;
  let service: FeatureFlagsService;

  beforeEach(async () => {
    redis = new (Redis as any)();
    await redis.flushall();
    service = new FeatureFlagsService(redis);
  });

  it('returns all flags via set-based scan', async () => {
    await service.set('foo', true);
    await service.set('bar', false);

    const sscanSpy = jest.spyOn(redis, 'sscan');
    const scanSpy = jest.spyOn(redis, 'scan');

    const flags = await service.getAll();

    expect(flags).toEqual({ foo: true, bar: false });
    expect(sscanSpy).toHaveBeenCalled();
    expect(scanSpy).not.toHaveBeenCalled();
  });

  it('falls back to keyspace scan when set empty', async () => {
    await redis.set('feature-flag:legacy', '1');

    const sscanSpy = jest.spyOn(redis, 'sscan');
    const scanSpy = jest.spyOn(redis, 'scan');

    const flags = await service.getAll();

    expect(flags).toEqual({ legacy: true });
    expect(sscanSpy).toHaveBeenCalled();
    expect(scanSpy).toHaveBeenCalled();
  });
});
