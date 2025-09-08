import { PaymentProviderService } from './payment-provider.service';

describe('PaymentProviderService', () => {
  let provider: PaymentProviderService;

  beforeEach(() => {
    process.env.STRIPE_API_KEY = 'test_key';
    provider = new PaymentProviderService({} as any);
  });

  it('createPaymentIntent calls request with correct params', async () => {
    const request = jest
      .spyOn(provider as any, 'request')
      .mockResolvedValue({ id: 'pi_123' });
    const body = 'amount=1';
    const result = await provider.createPaymentIntent(body);
    expect(request).toHaveBeenCalledWith(
      'https://api.stripe.com/v1/payment_intents',
      {
        method: 'POST',
        headers: (provider as any).authHeaders(),
        body,
      },
    );
    expect(result).toEqual({ id: 'pi_123' });
  });

  it('getStatus calls request with correct params', async () => {
    const request = jest
      .spyOn(provider as any, 'request')
      .mockResolvedValue({ status: 'succeeded' });
    const result = await provider.getStatus('pi_123');
    expect(request).toHaveBeenCalledWith(
      'https://api.stripe.com/v1/payment_intents/pi_123',
      {
        method: 'GET',
        headers: { Authorization: `Bearer test_key` },
      },
    );
    expect(result).toBe('approved');
  });
});
