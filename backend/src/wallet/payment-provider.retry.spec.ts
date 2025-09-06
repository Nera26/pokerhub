import { PaymentProviderService } from './payment-provider.service';
import type { ProviderCallback } from '@shared/wallet.schema';
import Redis from 'ioredis';

describe('PaymentProviderService webhook retries', () => {
  const connection = { host: '127.0.0.1', port: 6379 };
  let redis: Redis;

  beforeAll(() => {
    process.env.REDIS_HOST = connection.host;
    process.env.REDIS_PORT = String(connection.port);
    redis = new Redis(connection.port, connection.host);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('retries failed webhooks and clears keys', async () => {
    await redis.flushall();
    const provider = new PaymentProviderService(redis as any);
    const handler = jest
      .fn()
      .mockRejectedValueOnce(new Error('initial'))
      .mockRejectedValueOnce(new Error('worker1'))
      .mockResolvedValueOnce(undefined);
    provider.registerHandler('test', handler);
    const event: ProviderCallback = {
      eventId: 'evt1',
      idempotencyKey: 'idem-retry',
      providerTxnId: 'tx1',
      status: 'approved',
    };
    const key = `provider:webhook:${event.idempotencyKey}`;
    await provider.handleWebhook(event, 'test');
    expect(await redis.get(key)).not.toBeNull();

    const queue = (provider as any).retryQueue;
    while (true) {
      const counts = await queue.getJobCounts('waiting', 'delayed', 'active');
      if (counts.waiting + counts.delayed + counts.active === 0) break;
      await new Promise((r) => setTimeout(r, 50));
    }

    expect(handler).toHaveBeenCalledTimes(3);
    expect(await redis.get(key)).toBeNull();
    const counts = await queue.getJobCounts('waiting', 'delayed', 'active');
    expect(counts.waiting + counts.delayed + counts.active).toBe(0);
    await (provider as any).retryWorker.close();
    await (provider as any).retryQueue.close();
    await redis.flushall();
  }, 10000);
});

