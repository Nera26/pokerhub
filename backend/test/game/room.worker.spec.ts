import { RoomManager } from '../../src/game/room.service';

describe('RoomWorker lifecycle', () => {
  it('creates, reuses, and terminates workers', async () => {
    const manager = new RoomManager();
    const worker1 = manager.get('t1');

    const state0 = await worker1.getPublicState();
    expect(state0.street).toBe('preflop');

    const state1 = await worker1.apply({ type: 'next' });
    expect(state1.street).toBe('flop');

    const sameWorker = manager.get('t1');
    expect(sameWorker).toBe(worker1);

    const terminateSpy = jest.spyOn(worker1, 'terminate');
    await manager.close('t1');
    expect(terminateSpy).toHaveBeenCalled();

    const worker2 = manager.get('t1');
    expect(worker2).not.toBe(worker1);

    await manager.close('t1');
  });

  it('replays current hand', async () => {
    const manager = new RoomManager();
    const worker = manager.get('t2');
    await worker.apply({ type: 'next' });
    const replay = await worker.replay();
    expect(replay.street).toBe('flop');
    await manager.close('t2');
  });
});
