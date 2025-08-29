import { PaymentProviderService } from '../../src/wallet/payment-provider.service';

describe('PaymentProviderService retries', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    (global.fetch as any) = originalFetch;
    jest.restoreAllMocks();
  });

  it('retries initiate3DS until success', async () => {
    const service = new PaymentProviderService();
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
    const service = new PaymentProviderService();
    const fetchMock = jest
      .spyOn(global, 'fetch' as any)
      .mockRejectedValue(new Error('network'));
    await expect(service.getStatus('pi_1')).rejects.toThrow(
      /failed after 3 attempts/,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

