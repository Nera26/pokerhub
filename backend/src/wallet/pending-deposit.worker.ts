import { WalletService } from './wallet.service';
import { createQueue } from '../redis/queue';
import { Worker } from 'bullmq';

export async function startPendingDepositWorker(wallet: WalletService) {
  const queue = await createQueue('pending-deposit');
  new Worker(
    'pending-deposit',
    async (job) => {
      await wallet.markActionRequiredIfPending(job.data.id, job.id);
    },
    { connection: queue.opts.connection, removeOnComplete: { count: 1000 } },
  );

  const expireQueue = await createQueue('pending-deposit-expire');
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
