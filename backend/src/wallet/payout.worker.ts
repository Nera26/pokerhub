import { WalletService } from './wallet.service';

export async function startPayoutWorker(wallet: WalletService) {
  const bull = await import('bullmq');
  new bull.Worker(
    'payout',
    async (job) => {
      await wallet.processDisbursement(job.data.id);
    },
    {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    },
  );
}
