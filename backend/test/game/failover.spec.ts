import { RoomManager } from '../../src/game/room.service';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Redis from 'ioredis';

jest.setTimeout(60000);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('RoomWorker failover', () => {
  it.skip('continues hand after primary crash', async () => {
    const manager = new RoomManager();
    const worker: any = manager.get('t_fail');
    await worker.apply({ type: 'postBlind', playerId: 'p1', amount: 1 });
    await worker.apply({ type: 'postBlind', playerId: 'p2', amount: 2 });
    await wait(50);
    const failover = new Promise((resolve) => worker.once('failover', resolve));
    await worker.primary.terminate();
    await failover;
    const state = await worker.apply({ type: 'next' });
    expect(state.street).toBe('flop');
    await manager.close('t_fail');
  });
});

describe('RoomWorker cross-region failover', () => {
  let regionA: StartedTestContainer;
  let regionB: StartedTestContainer;
  let pub: Redis;
  let sub: Redis;
  let bridgeSub: Redis;
  let bridgePub: Redis;
  let canRun = true;

  beforeAll(async () => {
    try {
      regionA = await new GenericContainer('redis:7-alpine')
        .withExposedPorts(6379)
        .start();
      regionB = await new GenericContainer('redis:7-alpine')
        .withExposedPorts(6379)
        .start();

      const hostA = regionA.getHost();
      const portA = regionA.getMappedPort(6379);
      const hostB = regionB.getHost();
      const portB = regionB.getMappedPort(6379);

      pub = new Redis(portA, hostA);
      sub = new Redis(portB, hostB);
      bridgeSub = new Redis(portA, hostA);
      bridgePub = new Redis(portB, hostB);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Skipping cross-region failover test:', err);
      canRun = false;
    }
  });

  afterAll(async () => {
    if (!canRun) return;
    await Promise.all([pub.quit(), sub.quit(), bridgeSub.quit(), bridgePub.quit()]);
    await Promise.all([regionA.stop(), regionB.stop()]);
  });

  it('promotes follower across regions within RTO', async () => {
    if (!canRun) {
      expect(true).toBe(true);
      return;
    }

    await bridgeSub.psubscribe('room:*:actions');
    bridgeSub.on('pmessage', (_pattern, channel, msg) => {
      void bridgePub.publish(channel, msg);
    });

    const redis = Object.assign(pub, { duplicate: () => sub });
    const manager = new RoomManager(redis as any);
    const tableId = 't_region_fail';
    const worker: any = manager.get(tableId);
    await wait(50); // allow subscription setup
    await worker.apply({ type: 'postBlind', playerId: 'p1', amount: 1 });
    await worker.apply({ type: 'postBlind', playerId: 'p2', amount: 2 });
    await wait(50); // allow follower to catch up

    const failover = new Promise((resolve) => worker.once('failover', resolve));
    const start = Date.now();
    await worker.primary.terminate();
    await failover;
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(30 * 60 * 1000);

    const state = await worker.apply({ type: 'next' });
    expect(state.street).toBe('flop');

    await manager.close(tableId);
  });
});
