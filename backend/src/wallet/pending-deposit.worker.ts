import { Logger } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { createQueue } from '../redis/queue';
import { Worker } from 'bullmq';
import { logBootstrapNotice } from '../common/logging.utils';

const logger = new Logger('PendingDepositWorker');

export async function startPendingDepositWorker(wallet: WalletService) {
  const queue = await createQueue('pending-deposit');
  if (!queue.opts.connection) {
    logBootstrapNotice(
      logger,
      'Redis queue connection is unavailable; pending-deposit jobs will be processed inline.',
    );
  } else {
    new Worker(
      'pending-deposit',
      async (job) => {
        await wallet.markActionRequiredIfPending(job.data.id, job.id);
      },
      { connection: queue.opts.connection, removeOnComplete: { count: 1000 } },
    );
  }

  const expireQueue = await createQueue('pending-deposit-expire');
  if (!expireQueue.opts.connection) {
    logBootstrapNotice(
      logger,
      'Redis queue connection is unavailable; falling back to an interval scheduler for pending-deposit expiry.',
    );
    const run = async () => {
      try {
        await wallet.rejectExpiredPendingDeposits();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to reject expired pending deposits: ${message}`);
      }
    };
    void run();
    setInterval(() => {
      void run();
    }, 60_000);
    return;
  }

  await expireQueue.add(
    'expire',
    {},
    {
      jobId: 'pending-deposit-expire',
      repeat: { every: 60_000 },
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  new Worker(
    'pending-deposit-expire',
    async () => {
      await wallet.rejectExpiredPendingDeposits();
    },
    { connection: expireQueue.opts.connection, removeOnComplete: { count: 1000 } },
  );
}
