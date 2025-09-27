import { KycService, VerificationJob } from '../common/kyc.service';
import type { Job } from 'bullmq';
import { createQueue } from '../redis/queue';

export async function startKycWorker(kyc: KycService) {
  const queue = await createQueue('kyc');
  if (!queue.opts.connection) {
    console.warn('Skipping KYC worker startup; Redis queue connection is unavailable.');
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
