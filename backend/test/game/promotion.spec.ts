import { RoomManager } from '../../src/game/room.service';

jest.setTimeout(15000);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('RoomWorker promotion', () => {
  it('promotes follower when primary crashes', async () => {
    const manager = new RoomManager();
    const worker: any = manager.get('t1');
    await worker.apply({ type: 'postBlind', playerId: 'p1', amount: 1 });
    await worker.apply({ type: 'postBlind', playerId: 'p2', amount: 2 });

    // Simulate crash of primary worker
    await worker.primary.terminate();

    // Wait for heartbeat to promote follower
    await wait(200);

    const state = await worker.apply({ type: 'next' });
    expect(state.street).toBe('flop');

    await manager.close('t1');
  });
});

