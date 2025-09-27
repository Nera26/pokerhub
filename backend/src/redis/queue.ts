import type { Queue } from 'bullmq';
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';
import { logBootstrapNotice } from '../common/logging.utils';

let loggedInMemoryQueue = false;
const logger = new Logger('RedisQueue');

class InMemoryQueue {
  public readonly opts = { connection: undefined } as {
    connection?: Redis | Record<string, unknown>;
  };

  constructor(private readonly name: string) {}

  async add(jobName: string, data: unknown, _opts?: unknown): Promise<unknown> {
    logBootstrapNotice(
      logger,
      `Queue "${this.name}" is disabled because Redis is unavailable; job "${jobName}" will not be enqueued.`,
    );
    return { id: `${Date.now()}`, name: jobName, data };
  }

  async getJob(_id: string): Promise<undefined> {
    return undefined;
  }

  async getFailed(): Promise<unknown[]> {
    return [];
  }

  async getJobCounts(..._types: string[]): Promise<Record<string, number>> {
    return { waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0, paused: 0 };
  }
}

/**
 * createQueue initializes a BullMQ queue with the configured Redis host and port.
 * The BullMQ import is dynamic so tests can run without a Redis instance.
 */
export async function createQueue(name: string): Promise<Queue> {
  const bull = await import('bullmq');
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  if (
    process.env.REDIS_IN_MEMORY === '1' ||
    (!process.env.REDIS_URL && !process.env.REDIS_HOST && !process.env.REDIS_PORT && nodeEnv !== 'production')
  ) {
    process.env.REDIS_IN_MEMORY = '1';
    if (!loggedInMemoryQueue) {
      logger.log(`Redis queues are disabled; using in-memory queue stub for "${name}".`);
      loggedInMemoryQueue = true;
    }
    return new InMemoryQueue(name) as unknown as Queue;
  }

  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = Number(process.env.REDIS_PORT ?? 6379);
  const url = process.env.REDIS_URL ?? `redis://${host}:${port}`;
  const connection = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 500,
    maxRetriesPerRequest: null,
    retryStrategy: () => null,
  });

  try {
    await connection.connect();
    process.env.REDIS_IN_MEMORY = '0';
    return new bull.Queue(name, { connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logBootstrapNotice(
      logger,
      `Redis queue connection failed (${message}); using in-memory queue stub for "${name}".`,
    );
    try {
      await connection.disconnect();
    } catch {
      /* ignore */
    }
    process.env.REDIS_IN_MEMORY = '1';
    return new InMemoryQueue(name) as unknown as Queue;
  }
}
