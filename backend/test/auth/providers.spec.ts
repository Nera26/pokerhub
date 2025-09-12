import { GbgProvider } from '../../src/auth/providers/gbg.provider';
import { TruliooProvider } from '../../src/auth/providers/trulioo.provider';

describe('country providers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches country via GBG API', async () => {
    const mock = jest.spyOn(global as any, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ countryCode: 'GB' }),
    } as any);
    const provider = new GbgProvider('gbg-key');
    await expect(provider.getCountry('1.2.3.4')).resolves.toBe('GB');
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('api.gbgplc.com'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer gbg-key' }),
      }),
    );
  });

  it('fetches country via Trulioo API', async () => {
    const mock = jest.spyOn(global as any, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ countryCode: 'CA' }),
    } as any);
    const provider = new TruliooProvider('trulioo-key');
    await expect(provider.getCountry('5.6.7.8')).resolves.toBe('CA');
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('api.trulioo.com'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-trulioo-api-key': 'trulioo-key' }),
      }),
    );
  });
});
