import { CountryProvider } from './country-provider';

interface CountryResponse {
  countryCode?: string;
  CountryCode?: string;
  country?: string;
  Country?: string;
}

interface FetchCountryOptions {
  url: string;
  headers?: HeadersInit;
}

export async function fetchCountry(
  ip: string,
  { url, headers = {} }: FetchCountryOptions,
): Promise<string> {
  const endpoint = url.endsWith('/') ? url : `${url}/`;
  const res = await fetch(`${endpoint}${ip}`, { headers });
  if (!res.ok) {
    throw new Error(`Country lookup failed: ${res.status}`);
  }
  const data = (await res.json()) as CountryResponse;
  return (
    data.countryCode ||
    data.CountryCode ||
    data.country ||
    data.Country ||
    ''
  );
}

export class HttpCountryProvider implements CountryProvider {
  constructor(
    private readonly url: string,
    private readonly headers: HeadersInit = {},
  ) {}

  getCountry(ip: string): Promise<string> {
    return fetchCountry(ip, { url: this.url, headers: this.headers });
  }
}

