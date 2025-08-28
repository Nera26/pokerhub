import { CountryProvider } from './country-provider';

export class GbgProvider implements CountryProvider {
  async getCountry(ip: string): Promise<string> {
    const res = await fetch(`https://ipapi.co/${ip}/country/`);
    return (await res.text()).trim();
  }
}
