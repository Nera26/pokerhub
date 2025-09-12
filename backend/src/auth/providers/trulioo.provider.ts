import { CountryProvider } from './country-provider';

interface TruliooResponse {
  countryCode?: string;
  CountryCode?: string;
  country?: string;
  Country?: string;
}

export class TruliooProvider implements CountryProvider {
  constructor(private readonly apiKey: string) {}

  async getCountry(ip: string): Promise<string> {
    const res = await fetch(`https://api.trulioo.com/ip/v1/${ip}`, {
      headers: {
        'x-trulioo-api-key': this.apiKey,
      },
    });
    if (!res.ok) {
      throw new Error(`Trulioo lookup failed: ${res.status}`);
    }
    const data = (await res.json()) as TruliooResponse;
    return (
      data.countryCode ||
      data.CountryCode ||
      data.country ||
      data.Country ||
      ''
    );
  }
}
