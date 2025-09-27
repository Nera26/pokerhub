import { Logger } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { createQueue } from '../redis/queue';
import { Worker } from 'bullmq';
import { logBootstrapNotice } from '../common/logging.utils';

const logger = new Logger('PayoutWorker');

export async function startPayoutWorker(wallet: WalletService) {
  const queue = await createQueue('payout');
  if (!queue.opts.connection) {
    logBootstrapNotice(
      logger,
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
