import { RoomManager } from '../../src/game/room.service';

jest.setTimeout(15000);

describe('RoomWorker lifecycle', () => {
  it('creates, reuses, and terminates workers', async () => {
    const manager = new RoomManager();
    try {
      const worker1 = manager.get('t1');
      const state0 = await worker1.getPublicState();
      expect(state0.phase).toBe('WAIT_BLINDS');

      await worker1.apply({ type: 'postBlind', playerId: 'p1', amount: 1 });
      const state1 = await worker1.apply({ type: 'postBlind', playerId: 'p2', amount: 2 });
      expect(state1.phase).toBe('BETTING_ROUND');

      const state2 = await worker1.apply({ type: 'next' });
      expect(state2.street).toBe('flop');

      const sameWorker = manager.get('t1');
      expect(sameWorker).toBe(worker1);

      const terminateSpy = jest.spyOn(worker1, 'terminate');
      await manager.close('t1');
      expect(terminateSpy).toHaveBeenCalled();

      const worker2 = manager.get('t1');
      expect(worker2).not.toBe(worker1);

      await manager.close('t1');
    } finally {
      await manager.onModuleDestroy();
    }
  });

  it('replays current hand', async () => {
    const manager = new RoomManager();
    try {
      const worker = manager.get('t2');
      await worker.apply({ type: 'postBlind', playerId: 'p1', amount: 1 });
      await worker.apply({ type: 'postBlind', playerId: 'p2', amount: 2 });
      await worker.apply({ type: 'next' });
      const replay = await worker.replay();
      expect(replay.street).toBe('flop');
    } finally {
      await manager.onModuleDestroy();
    }
  });

  it('rejects pending calls when worker errors', async () => {
    const manager = new RoomManager();
    const worker: any = manager.get('t_err');
    try {
      const pending = worker.getPublicState();
      worker.primary.worker.emit('error', new Error('boom'));
      await expect(pending).rejects.toThrow('worker error: boom');
    } finally {
      await manager.onModuleDestroy();
    }
  });

  it('cleans up workers after errors', async () => {
    const manager = new RoomManager();
    const worker: any = manager.get('t_clean');
    const terminateSpy = jest.spyOn(worker, 'terminate');
    try {
      const pending = worker.getPublicState();
      worker.primary.worker.emit('error', new Error('boom'));
      await expect(pending).rejects.toThrow();
    } finally {
      await manager.onModuleDestroy();
    }
    expect(terminateSpy).toHaveBeenCalled();
  });
});
