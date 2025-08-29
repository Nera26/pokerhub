import { RoomManager } from '../../src/game/room.service';

jest.setTimeout(15000);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('RoomWorker failover', () => {
  it('continues hand after primary crash', async () => {
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
