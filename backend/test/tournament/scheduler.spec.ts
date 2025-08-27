import { TournamentScheduler } from '../../src/tournament/scheduler.service';

describe('TournamentScheduler', () => {
  it('schedules level up jobs', async () => {
    const scheduler: any = new TournamentScheduler();
    const fakeQueue = { add: jest.fn() };
    scheduler['queues'].set('level-up', fakeQueue);
    const start = new Date(Date.now() + 1000);
    await scheduler.scheduleLevelUps(
      't1',
      [
        { level: 1, durationMinutes: 1 },
        { level: 2, durationMinutes: 1 },
      ],
      start,
    );
    expect(fakeQueue.add).toHaveBeenCalledWith(
      'level',
      { tournamentId: 't1', level: 2 },
      expect.objectContaining({ delay: expect.any(Number) }),
    );
  });
});
