import { Queue } from 'bullmq';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import type { ProviderCallback } from '../../src/schemas/wallet';

describe('PaymentProviderService persistent retries', () => {
  beforeAll(() => {
    process.env.REDIS_HOST = '127.0.0.1';
    process.env.REDIS_PORT = '6379';
  });

  it('drains jobs left in queue on restart', async () => {
    const event: ProviderCallback = {
      eventId: 'evt1',
      idempotencyKey: 'idem1',
      providerTxnId: 'tx1',
      status: 'approved',
    };
    const preQueue = new Queue('provider-webhook-retry', {
      connection: { host: '127.0.0.1', port: 6379 },
    });
    await preQueue.add('retry', { event, handlerKey: 'test' }, { jobId: event.idempotencyKey });
    await preQueue.close();

    const provider = new PaymentProviderService();
    provider.registerHandler('test', async () => {
      /* no-op */
    });
    await provider.drainQueue();
    await (provider as any).retryWorker.close();
    await (provider as any).retryQueue.close();

    const checkQueue = new Queue('provider-webhook-retry', {
      connection: { host: '127.0.0.1', port: 6379 },
    });
    const counts = await checkQueue.getJobCounts('waiting', 'active', 'failed');
    await checkQueue.close();
    expect(counts.waiting + counts.active + counts.failed).toBe(0);
  }, 10000);
});
