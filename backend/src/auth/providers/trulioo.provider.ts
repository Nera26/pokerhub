import { CountryProvider } from './country-provider';
import { HttpCountryProvider } from './http-country.provider';

export function createTruliooProvider(
  url: string,
  apiKey: string,
): CountryProvider {
  return new HttpCountryProvider(url, {
    'x-trulioo-api-key': apiKey,
  });
}

