import { RoomManager } from '../../src/game/room.service';

jest.setTimeout(15000);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('RoomWorker promotion', () => {
  it('promotes follower when primary crashes', async () => {
    const manager = new RoomManager();
    try {
      const worker: any = manager.get('t1');
      await worker.apply({ type: 'postBlind', playerId: 'p1', amount: 1 });
      await worker.apply({ type: 'postBlind', playerId: 'p2', amount: 2 });

      await wait(50); // allow follower to process actions
      expect(worker.lastConfirmed).toBe(2);

      const failover = new Promise((resolve) => worker.once('failover', resolve));
      // Simulate crash of primary worker
      await worker.primary.terminate();

      // Wait for follower promotion
      await failover;

      const state = await worker.apply({ type: 'next' });
      expect(state.street).toBe('flop');
    } finally {
      await manager.onModuleDestroy();
    }
  });
});

