import { WalletService } from './wallet.service';
import { createQueue } from '../redis/queue';
import { Worker } from 'bullmq';
import { logInfrastructureNotice } from '../common/logging';

export async function startPayoutWorker(wallet: WalletService) {
  const queue = await createQueue('payout');
  if (!queue.opts.connection) {
    logInfrastructureNotice(
      'Redis queue connection is unavailable; payout jobs will be processed inline.',
    );
    return;
  }
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
