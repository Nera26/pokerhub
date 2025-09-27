import { Logger } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { createQueue } from '../redis/queue';
import { Worker } from 'bullmq';

const logger = new Logger('PendingDepositWorker');

export async function startPendingDepositWorker(wallet: WalletService) {
  // Worker for handling pending deposit jobs
  const queue = await createQueue('pending-deposit');
  if (!queue.opts.connection) {
    logger.warn(
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

  // Worker for expiring pending deposits
  const expireQueue = await createQueue('pending-deposit-expire');
  if (!expireQueue.opts.connection) {
    logger.warn(
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

    // Run immediately and then on interval
    void run();
    setInterval(() => void run(), 60_000);
    return;
  }

  // Schedule expiration jobs in Redis
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
