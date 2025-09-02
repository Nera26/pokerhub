import { CollusionService } from '../../src/analytics/collusion.service';
import type Redis from 'ioredis';
import { MockRedis } from '../utils/mock-redis';

describe('CollusionService', () => {
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

  it('extracts features and flags sessions', async () => {
    await service.record('u1', 'd1', '2.2.2.2', 1000);
    await service.record('u2', 'd1', '2.2.2.2', 1000);
    const features = await service.extractFeatures(
      'u1',
      'u2',
      [1, 0, 1],
      [1, 0, 1],
      [0, 1, 2],
      [1, 2, 3],
    );
    expect(features.sharedDevices).toEqual(['d1']);
    expect(features.sharedIps).toEqual(['2.2.2.2']);
    expect(features.vpipCorrelation).toBeCloseTo(1);
    expect(features.timingSimilarity).toBeCloseTo(1);
    expect(features.seatProximity).toBeCloseTo(0.5);
    await service.flagSession('s1', ['u1', 'u2'], features);
    await expect(service.applyAction('s1', 'restrict', 'r1')).rejects.toThrow(
      'Invalid review action',
    );
    await service.applyAction('s1', 'warn', 'r1');
    await service.applyAction('s1', 'restrict', 'r1');
    await service.applyAction('s1', 'ban', 'r1');
    const flagged = await service.listFlaggedSessions();
    expect(flagged[0]).toMatchObject({ id: 's1', status: 'ban' });
    const log = await client.lrange('collusion:session:s1:log', 0, -1);
    expect(log).toHaveLength(3);
    expect(JSON.parse(log[0])).toHaveProperty('reviewerId', 'r1');
    const history = await service.getActionHistory('s1');
    expect(history[0]).toMatchObject({ reviewerId: 'r1' });
  });

  it('creates reviewable entry for shared device and ip', async () => {
    await service.record('u1', 'shared', '9.9.9.9', 1000);
    await service.record('u2', 'shared', '9.9.9.9', 2000);
    const features = await service.extractFeatures(
      'u1',
      'u2',
      [1],
      [1],
      [0],
      [1],
    );
    await service.flagSession('s-shared', ['u1', 'u2'], features);
    const sessions = await service.listFlaggedSessions();
    expect(sessions).toEqual([
      expect.objectContaining({
        id: 's-shared',
        users: ['u1', 'u2'],
        status: 'flagged',
      }),
    ]);
  });

  it('paginates and filters sessions', async () => {
    await service.flagSession('s1', ['u1'], {});
    await service.flagSession('s2', ['u2'], {});
    await service.applyAction('s1', 'warn', 'r1');
    const page1 = await service.listFlaggedSessions({ page: 1, pageSize: 1 });
    expect(page1).toHaveLength(1);
    const warned = await service.listFlaggedSessions({ status: 'warn' });
    expect(warned).toEqual([
      expect.objectContaining({ id: 's1', status: 'warn' }),
    ]);
  });
});
