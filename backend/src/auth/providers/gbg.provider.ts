import { CountryProvider } from './country-provider';

interface GbgResponse {
  countryCode?: string;
  CountryCode?: string;
  country?: string;
  Country?: string;
}

export class GbgProvider implements CountryProvider {
  constructor(private readonly apiKey: string) {}

  async getCountry(ip: string): Promise<string> {
    const res = await fetch(`https://api.gbgplc.com/ip/v1/${ip}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
    if (!res.ok) {
      throw new Error(`GBG lookup failed: ${res.status}`);
    }
    const data = (await res.json()) as GbgResponse;
    return (
      data.countryCode ||
      data.CountryCode ||
      data.country ||
      data.Country ||
      ''
    );
  }
}
