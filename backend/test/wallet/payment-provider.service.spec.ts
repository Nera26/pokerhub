import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { createInMemoryRedis } from '../utils/mock-redis';

describe('PaymentProviderService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    (global.fetch as any) = originalFetch;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('retries initiate3DS until success', async () => {
    const { redis } = createInMemoryRedis();
    const service = new PaymentProviderService(redis as any);
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'pi_success' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const result = await service.initiate3DS('acct1', 10);
    expect(result).toEqual({ id: 'pi_success' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('uses env base URL and currency when provided', async () => {
    const prevBaseUrl = process.env.PAYMENT_PROVIDER_BASE_URL;
    const prevCurrency = process.env.DEFAULT_CURRENCY;
    process.env.PAYMENT_PROVIDER_BASE_URL = 'https://example.com';
    process.env.DEFAULT_CURRENCY = 'eur';
    try {
      const { redis } = createInMemoryRedis();
      const service = new PaymentProviderService(redis as any);
      const fetchMock = jest
        .spyOn(global, 'fetch' as any)
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 'pi_env' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      const result = await service.initiate3DS('acct1', 10);
      expect(result).toEqual({ id: 'pi_env' });
      expect(fetchMock).toHaveBeenCalledWith(
        'https://example.com/payment_intents',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('currency=eur'),
        }),
      );
    } finally {
      if (prevBaseUrl === undefined) delete process.env.PAYMENT_PROVIDER_BASE_URL;
      else process.env.PAYMENT_PROVIDER_BASE_URL = prevBaseUrl;
      if (prevCurrency === undefined) delete process.env.DEFAULT_CURRENCY;
      else process.env.DEFAULT_CURRENCY = prevCurrency;
    }
  });

  it('throws descriptive error when getStatus exhausts retries', async () => {
    const { redis } = createInMemoryRedis();
    const service = new PaymentProviderService(redis as any);
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockRejectedValue(new Error('network'));
    await expect(service.getStatus('pi_1')).rejects.toThrow(
      /failed after 3 attempts/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('deduplicates concurrent webhook events and cleans up', async () => {
    const { redis } = createInMemoryRedis();
    const service = new PaymentProviderService(redis as any);
    (service as any).initQueue = jest.fn().mockResolvedValue(undefined);
    const handler = jest
      .fn()
      .mockImplementation(async () => await new Promise((r) => setTimeout(r, 10)));
    service.registerHandler('test', handler);
    const event = {
      eventId: 'evt1',
      idempotencyKey: 'idem1',
      providerTxnId: 'tx1',
      status: 'approved',
    };
    await Promise.all([
      service.handleWebhook(event as any, 'test'),
      service.handleWebhook(event as any, 'test'),
    ]);
    expect(handler).toHaveBeenCalledTimes(1);
    const key = (service as any).redisKey('idem1');
    expect(await redis.get(key)).toBeNull();
  });

});

