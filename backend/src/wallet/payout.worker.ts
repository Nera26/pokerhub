import { WalletService } from './wallet.service';
import { createQueue } from '../redis/queue';
import { Worker } from 'bullmq';

export async function startPayoutWorker(wallet: WalletService) {
  const queue = await createQueue('payout');
  new Worker(
    'payout',
    async (job) => {
      await wallet.requestDisbursement(job.data.id, job.data.currency);
    },
    {
      connection: queue.opts.connection,
      removeOnComplete: { count: 1000 },
    },
  );
}
