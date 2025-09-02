import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { MockRedis } from '../utils/mock-redis';

describe('PaymentProviderService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    (global.fetch as any) = originalFetch;
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('retries initiate3DS until success', async () => {
    const service = new PaymentProviderService(new MockRedis() as any);
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'pi_success' }), { status: 200 }),
      );
    const result = await service.initiate3DS('acct1', 10);
    expect(result).toEqual({ id: 'pi_success' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws descriptive error when getStatus exhausts retries', async () => {
    const service = new PaymentProviderService(new MockRedis() as any);
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockRejectedValue(new Error('network'));
    await expect(service.getStatus('pi_1')).rejects.toThrow(
      /failed after 3 attempts/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('deduplicates concurrent webhook events and cleans up', async () => {
    const redis = new MockRedis();
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

  it('opens circuit breaker after consecutive failures and recovers', async () => {
    jest.useFakeTimers();
    const service = new PaymentProviderService(new MockRedis() as any);
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockRejectedValue(new Error('boom'));
    const fetchWithRetry = (service as any).fetchWithRetry.bind(service);
    const url = 'http://provider';

    for (let i = 0; i < 5; i++) {
      await expect(fetchWithRetry(url, {}, 1, 100)).rejects.toThrow(/boom/);
    }

    await expect(fetchWithRetry(url, {}, 1, 100)).rejects.toThrow(
      /circuit breaker open/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(5);

    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    jest.advanceTimersByTime(30_000);

    await expect(fetchWithRetry(url, {}, 1, 100)).resolves.toBeInstanceOf(
      Response,
    );
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});

