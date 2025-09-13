import { ConfigService } from '@nestjs/config';
import { CountryProvider } from './country-provider';
import { createGbgProvider } from './gbg.provider';
import { createTruliooProvider } from './trulioo.provider';
export { CountryProvider } from './country-provider';
export { createGbgProvider } from './gbg.provider';
export { createTruliooProvider } from './trulioo.provider';

export function providerFactory(config: ConfigService): CountryProvider {
  const driver = config.get<string>('KYC_PROVIDER');
  switch (driver) {
    case 'trulioo':
      return createTruliooProvider(
        config.get<string>('TRULIOO_URL', 'https://api.trulioo.com/ip/v1'),
        config.get<string>('TRULIOO_API_KEY', ''),
      );
    case 'gbg':
    default:
      return createGbgProvider(
        config.get<string>('GBG_URL', 'https://api.gbgplc.com/ip/v1'),
        config.get<string>('GBG_API_KEY', ''),
      );
  }
}

