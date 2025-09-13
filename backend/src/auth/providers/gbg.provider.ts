import { CountryProvider } from './country-provider';
import { HttpCountryProvider } from './http-country.provider';

export function createGbgProvider(
  url: string,
  apiKey: string,
): CountryProvider {
  return new HttpCountryProvider(url, {
    Authorization: `Bearer ${apiKey}`,
  });
}

