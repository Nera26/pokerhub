import { CollusionService } from '../../src/analytics/collusion.service';
import type Redis from 'ioredis';

describe('CollusionService', () => {
  class MockRedis {
    sets = new Map<string, Set<string>>();
    sorted = new Map<string, number[]>();
    async sadd(key: string, value: string) {
      if (!this.sets.has(key)) this.sets.set(key, new Set());
      this.sets.get(key)!.add(value);
    }
    async smembers(key: string) {
      return Array.from(this.sets.get(key) ?? []);
    }
    async zadd(key: string, score: number, member: string) {
      if (!this.sorted.has(key)) this.sorted.set(key, []);
      const arr = this.sorted.get(key)!;
      arr.push(score);
      arr.sort((a, b) => a - b);
    }
    async zrange(key: string, start: number, stop: number) {
      const arr = this.sorted.get(key) ?? [];
      return arr.map((n) => n.toString());
    }
  }

  let service: CollusionService;
  let client: MockRedis;

  beforeEach(() => {
    client = new MockRedis();
    const typed: unknown = client;
    service = new CollusionService(typed as Redis);
  });

  it('clusters by device/ip and detects fast actions', async () => {
    await service.record('u1', 'd1', '1.1.1.1', 1000);
    await service.record('u2', 'd1', '1.1.1.2', 2000);
    await service.record('u3', 'd2', '1.1.1.1', 3000);
    expect(await service.getDeviceCluster('d1')).toEqual(
      expect.arrayContaining(['u1', 'u2']),
    );
    expect(await service.getIpCluster('1.1.1.1')).toEqual(
      expect.arrayContaining(['u1', 'u3']),
    );
    await service.record('u1', 'd1', '1.1.1.1', 1005);
    expect(await service.hasFastActions('u1', 10)).toBe(true);
  });
});
