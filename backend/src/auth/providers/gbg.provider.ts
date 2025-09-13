import { CountryProvider } from './country-provider';
import { fetchCountry } from './http-country.provider';

export class GbgProvider implements CountryProvider {
  constructor(
    private readonly url: string,
    private readonly headers: HeadersInit,
  ) {}

  getCountry(ip: string): Promise<string> {
    return fetchCountry(ip, { url: this.url, headers: this.headers });
  }
}

