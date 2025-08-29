import { RoomManager } from '../src/game/room.service';
import type { GameAction } from '../src/game/engine';
jest.setTimeout(15000);


describe('RoomWorker replay', () => {
  it('reconstructs state from log at each action index', async () => {
    const manager = new RoomManager();
    const worker = manager.get('replay-table');

    const actions: GameAction[] = [
      { type: 'postBlind', playerId: 'p1', amount: 1 },
      { type: 'postBlind', playerId: 'p1', amount: 2 },
    ];

    for (const [index, action] of actions.entries()) {
      await worker.apply(action);
      const log = await worker.resume(0);
      const [, expected] = log[index];
      const replayed = await worker.replay();
      expect(replayed).toEqual(expected);
    }

    await manager.close('replay-table');
  });
});
