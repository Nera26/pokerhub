jest.mock('../../src/redis/queue', () => ({
  createQueue: jest.fn(),
}));
const workerCtor = jest.fn().mockImplementation(() => ({
  waitUntilReady: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('bullmq', () => ({ Worker: workerCtor }));

import { createQueue } from '../../src/redis/queue';
import { WalletService } from '../../src/wallet/wallet.service';
import { startPayoutWorker } from '../../src/wallet/payout.worker';
import { startPendingDepositWorker } from '../../src/wallet/pending-deposit.worker';
import { TournamentScheduler } from '../../src/tournament/scheduler.service';
import { startLeaderboardRebuildWorker } from '../../src/leaderboard/rebuild.worker';

const createQueueMock = createQueue as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('queue integration', () => {
  it('WalletService.enqueueDisbursement uses createQueue', async () => {
    const add = jest.fn();
    createQueueMock.mockResolvedValueOnce({ add } as any);
    const wallet = new WalletService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { emit: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await (wallet as any).enqueueDisbursement('123', 'USD');
    expect(createQueueMock).toHaveBeenCalledWith('payout');
    expect(add).toHaveBeenCalledWith(
      'payout',
      { id: '123', currency: 'USD' },
      { removeOnComplete: true, removeOnFail: true },
    );
  });

  it('startPayoutWorker uses createQueue for connection', async () => {
    const connection = { host: 'h', port: 1 };
    createQueueMock.mockResolvedValueOnce({ opts: { connection } } as any);
    const wallet = { requestDisbursement: jest.fn() } as any;
    await startPayoutWorker(wallet);
    expect(createQueueMock).toHaveBeenCalledWith('payout');
    expect(workerCtor).toHaveBeenCalledWith(
      'payout',
      expect.any(Function),
      { connection, removeOnComplete: { count: 1000 } },
    );
  });

  it('startPendingDepositWorker schedules expire job via createQueue', async () => {
    const connection1 = { host: 'a', port: 2 };
    const connection2 = { host: 'b', port: 3 };
    const add = jest.fn();
    createQueueMock
      .mockResolvedValueOnce({ opts: { connection: connection1 } } as any)
      .mockResolvedValueOnce({ add, opts: { connection: connection2 } } as any);
    const wallet = {
      markActionRequiredIfPending: jest.fn(),
      rejectExpiredPendingDeposits: jest.fn(),
    } as any;
    await startPendingDepositWorker(wallet);
    expect(createQueueMock).toHaveBeenNthCalledWith(1, 'pending-deposit');
    expect(createQueueMock).toHaveBeenNthCalledWith(2, 'pending-deposit-expire');
    expect(add).toHaveBeenCalledWith(
      'expire',
      {},
      {
        jobId: 'pending-deposit-expire',
        repeat: { every: 60_000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    expect(workerCtor).toHaveBeenNthCalledWith(
      1,
      'pending-deposit',
      expect.any(Function),
      { connection: connection1, removeOnComplete: { count: 1000 } },
    );
    expect(workerCtor).toHaveBeenNthCalledWith(
      2,
      'pending-deposit-expire',
      expect.any(Function),
      { connection: connection2, removeOnComplete: { count: 1000 } },
    );
  });

  it('TournamentScheduler.scheduleRegistration enqueues jobs', async () => {
    const add = jest.fn();
    createQueueMock.mockResolvedValueOnce({ add } as any);
    const scheduler = new TournamentScheduler();
    jest.useFakeTimers().setSystemTime(new Date(0));
    await scheduler.scheduleRegistration('t1', new Date(1000), new Date(2000));
    expect(createQueueMock).toHaveBeenCalledWith('registration');
    expect(add).toHaveBeenCalledWith('open', { tournamentId: 't1' }, { delay: 1000 });
    expect(add).toHaveBeenCalledWith('close', { tournamentId: 't1' }, { delay: 2000 });
    jest.useRealTimers();
  });

  it('startLeaderboardRebuildWorker schedules rebuild job', async () => {
    const connection = { host: 'c', port: 4 };
    const add = jest.fn();
    createQueueMock.mockResolvedValueOnce({ add, opts: { connection } } as any);
    const leaderboard = {
      rebuildFromEvents: jest.fn().mockResolvedValue({ durationMs: 10 }),
    } as any;
    await startLeaderboardRebuildWorker(leaderboard);
    expect(createQueueMock).toHaveBeenCalledWith('leaderboard-rebuild');
    expect(add).toHaveBeenCalledWith(
      'rebuild',
      {},
      {
        jobId: 'leaderboard-rebuild',
        repeat: { cron: expect.any(String) },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    expect(workerCtor).toHaveBeenCalledWith(
      'leaderboard-rebuild',
      expect.any(Function),
      { connection },
    );
  });
});
