import { fetchCountry } from '../../src/auth/providers/http-country.provider';
import { createGbgProvider } from '../../src/auth/providers/gbg.provider';
import { createTruliooProvider } from '../../src/auth/providers/trulioo.provider';

describe('fetchCountry', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns country from successful response', async () => {
    const mock = jest.spyOn(global as any, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ countryCode: 'US' }),
    } as any);

    await expect(
      fetchCountry('1.2.3.4', {
        url: 'https://example.com/ip',
        headers: { Authorization: 'token' },
      }),
    ).resolves.toBe('US');

    expect(mock).toHaveBeenCalledWith('https://example.com/ip/1.2.3.4', {
      headers: { Authorization: 'token' },
    });
  });

  it('throws on non-OK response', async () => {
    jest
      .spyOn(global as any, 'fetch')
      .mockResolvedValue({ ok: false, status: 500 } as any);

    await expect(
      fetchCountry('1.2.3.4', { url: 'https://example.com' }),
    ).rejects.toThrow('Country lookup failed: 500');
  });
});

describe('createGbgProvider', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fetches country via GBG API', async () => {
    const mock = jest.spyOn(global as any, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ countryCode: 'GB' }),
    } as any);
    const provider = createGbgProvider(
      'https://api.gbgplc.com/ip/v1',
      'gbg-key',
    );
    await expect(provider.getCountry('1.2.3.4')).resolves.toBe('GB');
    expect(mock).toHaveBeenCalledWith(
      'https://api.gbgplc.com/ip/v1/1.2.3.4',
      { headers: { Authorization: 'Bearer gbg-key' } },
    );
  });

  it('throws on lookup failure', async () => {
    jest
      .spyOn(global as any, 'fetch')
      .mockResolvedValue({ ok: false, status: 404 } as any);
    const provider = createGbgProvider(
      'https://api.gbgplc.com/ip/v1',
      'gbg-key',
    );
    await expect(provider.getCountry('1.2.3.4')).rejects.toThrow(
      'Country lookup failed: 404',
    );
  });
});

describe('createTruliooProvider', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fetches country via Trulioo API', async () => {
    const mock = jest.spyOn(global as any, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ countryCode: 'CA' }),
    } as any);
    const provider = createTruliooProvider(
      'https://api.trulioo.com/ip/v1',
      'trulioo-key',
    );
    await expect(provider.getCountry('5.6.7.8')).resolves.toBe('CA');
    expect(mock).toHaveBeenCalledWith(
      'https://api.trulioo.com/ip/v1/5.6.7.8',
      { headers: { 'x-trulioo-api-key': 'trulioo-key' } },
    );
  });

  it('throws on lookup failure', async () => {
    jest
      .spyOn(global as any, 'fetch')
      .mockResolvedValue({ ok: false, status: 500 } as any);
    const provider = createTruliooProvider(
      'https://api.trulioo.com/ip/v1',
      'trulioo-key',
    );
    await expect(provider.getCountry('5.6.7.8')).rejects.toThrow(
      'Country lookup failed: 500',
    );
  });
});

