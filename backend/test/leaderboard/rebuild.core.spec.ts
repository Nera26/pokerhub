import { performRebuild } from '../../src/leaderboard/rebuild.core';

describe('performRebuild', () => {
  it('returns result on success', async () => {
    const leaderboard = {
      rebuildFromEvents: jest.fn().mockResolvedValue({ durationMs: 100, memoryMb: 5 }),
    } as any;

    await expect(performRebuild(leaderboard, 7)).resolves.toEqual({
      durationMs: 100,
      memoryMb: 5,
    });

    expect(leaderboard.rebuildFromEvents).toHaveBeenCalledWith(7, undefined);
  });

  it('throws on failure', async () => {
    const error = new Error('fail');
    const leaderboard = {
      rebuildFromEvents: jest.fn().mockRejectedValue(error),
    } as any;

    await expect(performRebuild(leaderboard, 7)).rejects.toThrow('fail');
  });
});
