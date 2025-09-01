/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { TournamentScheduler } from './scheduler.service';

class MockQueue {
  jobs: unknown[] = [];
  add = jest.fn(async (jobName: string, data: unknown, opts: any) => {
    if (!Number.isFinite(opts?.delay)) {
      throw new Error('Invalid delay');
    }
    this.jobs.push({ jobName, data, opts });
  });
}

describe('TournamentScheduler', () => {
  let scheduler: TournamentScheduler;

  function setQueue(name: string, q: MockQueue): void {
    (scheduler as unknown as { queues: Map<string, unknown> }).queues.set(
      name,
      q,
    );
  }

  beforeEach(() => {
    scheduler = new TournamentScheduler();
    jest.spyOn(Date, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enqueues registration open and close events', async () => {
    const q = new MockQueue();
    setQueue('registration', q);
    const open = new Date(1000);
    const close = new Date(2000);
    await scheduler.scheduleRegistration('t1', open, close);
    expect(q.add).toHaveBeenNthCalledWith(
      1,
      'open',
      { tournamentId: 't1' },
      { delay: 1000 },
    );
    expect(q.add).toHaveBeenNthCalledWith(
      2,
      'close',
      { tournamentId: 't1' },
      { delay: 2000 },
    );
  });

  it('enqueues late registration close', async () => {
    const q = new MockQueue();
    setQueue('late-registration', q);
    const close = new Date(1500);
    await scheduler.scheduleLateRegistration('t2', close);
    expect(q.add).toHaveBeenCalledWith(
      'close',
      { tournamentId: 't2' },
      { delay: 1500 },
    );
  });

  it('enqueues break start and end', async () => {
    const q = new MockQueue();
    setQueue('break', q);
    const start = new Date(3000);
    await scheduler.scheduleBreak('t3', start, 5000);
    expect(q.add).toHaveBeenNthCalledWith(
      1,
      'start',
      { tournamentId: 't3' },
      { delay: 3000 },
    );
    expect(q.add).toHaveBeenNthCalledWith(
      2,
      'end',
      { tournamentId: 't3' },
      { delay: 8000 },
    );
  });

  it('enqueues tournament start', async () => {
    const q = new MockQueue();
    setQueue('tournament-start', q);
    const start = new Date(4000);
    await scheduler.scheduleStart('t6', start);
    expect(q.add).toHaveBeenCalledWith('start', { tournamentId: 't6' }, { delay: 4000 });
  });

  it('enqueues level up events based on structure', async () => {
    const q = new MockQueue();
    setQueue('level-up', q);
    const structure = [
      { level: 1, durationMinutes: 10 },
      { level: 2, durationMinutes: 10 },
      { level: 3, durationMinutes: 15 },
    ];
    await scheduler.scheduleLevelUps('t4', structure, new Date(0));
    expect(q.add).toHaveBeenNthCalledWith(
      1,
      'level',
      { tournamentId: 't4', level: 2 },
      { delay: 600000 },
    );
    expect(q.add).toHaveBeenNthCalledWith(
      2,
      'level',
      { tournamentId: 't4', level: 3 },
      { delay: 1200000 },
    );
  });

  it('rejects when provided invalid dates', async () => {
    const q = new MockQueue();
    setQueue('registration', q);
    const invalid = new Date('invalid');
    await expect(
      scheduler.scheduleRegistration('bad', invalid, invalid),
    ).rejects.toThrow('Invalid delay');
  });

  it('propagates redis errors', async () => {
    const q = {
      add: jest.fn().mockRejectedValue(new Error('Redis down')),
    } as unknown as MockQueue;
    setQueue('registration', q);
    await expect(
      scheduler.scheduleRegistration('t5', new Date(1000), new Date(2000)),
    ).rejects.toThrow('Redis down');
  });
});
