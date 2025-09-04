import { WalletService } from './wallet.service';

export async function startPendingDepositWorker(wallet: WalletService) {
  const bull = await import('bullmq');
  const connection = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  };
  new bull.Worker(
    'pending-deposit',
    async (job) => {
      await wallet.markActionRequiredIfPending(job.data.id, job.id);
    },
    { connection },
  );

  const expireQueue = new bull.Queue('pending-deposit-expire', { connection });
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

  new bull.Worker(
    'pending-deposit-expire',
    async () => {
      await wallet.rejectExpiredPendingDeposits();
    },
    { connection },
  );
}
