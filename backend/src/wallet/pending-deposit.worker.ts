import { WalletService } from './wallet.service';

export async function startPendingDepositWorker(wallet: WalletService) {
  const bull = await import('bullmq');
  new bull.Worker(
    'pending-deposit',
    async (job) => {
      await wallet.markActionRequiredIfPending(job.data.id);
    },
    {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    },
  );
}
