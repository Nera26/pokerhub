import type { Queue } from 'bullmq';

/**
 * createQueue initializes a BullMQ queue with the configured Redis host and port.
 * The BullMQ import is dynamic so tests can run without a Redis instance.
 */
export async function createQueue(name: string): Promise<Queue> {
  const bull = await import('bullmq');
  return new bull.Queue(name, {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  });
}
