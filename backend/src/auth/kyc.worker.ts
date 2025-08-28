import { KycService, VerificationJob } from './kyc.service';
import type { Job } from 'bullmq';

export async function startKycWorker(kyc: KycService) {
  const bull = await import('bullmq');
  new bull.Worker(
    'kyc',
    async (job: Job<VerificationJob>) => {
      await kyc.process(job.data);
    },
    {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    },
  );
}
