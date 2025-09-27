import { Logger } from '@nestjs/common';
import { KycService, VerificationJob } from '../common/kyc.service';
import type { Job } from 'bullmq';
import { createQueue } from '../redis/queue';
import { logBootstrapNotice } from '../common/logging.utils';

const logger = new Logger('KycWorker');

export async function startKycWorker(kyc: KycService) {
  const queue = await createQueue('kyc');
  if (!queue.opts.connection) {
    logBootstrapNotice(
      logger,
      'Redis queue connection is unavailable; KYC jobs will be processed inline.',
    );
    return;
  }
  const bull = await import('bullmq');
  new bull.Worker(
    'kyc',
    async (job: Job<VerificationJob>) => {
      await kyc.validateJob(job.data);
    },
    {
      connection: queue.opts.connection,
    },
  );
}
