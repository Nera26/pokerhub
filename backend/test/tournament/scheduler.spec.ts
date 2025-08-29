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

  it('schedules registration window', async () => {
    const scheduler: any = new TournamentScheduler();
    const fakeQueue = { add: jest.fn() };
    scheduler['queues'].set('registration', fakeQueue);
    const now = 1000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const open = new Date(now + 5000);
    const close = new Date(now + 10000);
    await scheduler.scheduleRegistration('t1', open, close);
    expect(fakeQueue.add).toHaveBeenNthCalledWith(
      1,
      'open',
      { tournamentId: 't1' },
      { delay: 5000 },
    );
    expect(fakeQueue.add).toHaveBeenNthCalledWith(
      2,
      'close',
      { tournamentId: 't1' },
      { delay: 10000 },
    );
    (Date.now as jest.Mock).mockRestore();
  });

  it('schedules late registration close', async () => {
    const scheduler: any = new TournamentScheduler();
    const fakeQueue = { add: jest.fn() };
    scheduler['queues'].set('late-registration', fakeQueue);
    const now = 2000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const close = new Date(now + 3000);
    await scheduler.scheduleLateRegistration('t2', close);
    expect(fakeQueue.add).toHaveBeenCalledWith(
      'close',
      { tournamentId: 't2' },
      { delay: 3000 },
    );
    (Date.now as jest.Mock).mockRestore();
  });

  it('schedules breaks with correct timing', async () => {
    const scheduler: any = new TournamentScheduler();
    const fakeQueue = { add: jest.fn() };
    scheduler['queues'].set('break', fakeQueue);
    const now = 4000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    const start = new Date(now + 1000);
    await scheduler.scheduleBreak('t3', start, 3000);
    expect(fakeQueue.add).toHaveBeenNthCalledWith(
      1,
      'start',
      { tournamentId: 't3' },
      { delay: 1000 },
    );
    expect(fakeQueue.add).toHaveBeenNthCalledWith(
      2,
      'end',
      { tournamentId: 't3' },
      { delay: 4000 },
    );
    (Date.now as jest.Mock).mockRestore();
  });
});
