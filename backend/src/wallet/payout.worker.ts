import { WalletService } from './wallet.service';

export async function startPayoutWorker(wallet: WalletService) {
  const bull = await import('bullmq');
  new bull.Worker(
    'payout',
    async (job) => {
      await wallet.requestDisbursement(job.data.id, job.data.currency);
    },
    {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
      removeOnComplete: { count: 1000 },
    },
  );
}
