import { registerAs } from '@nestjs/config';

export default registerAs('kyc', () => ({
  apiUrl: process.env.KYC_API_URL ?? '',
  apiKey: process.env.KYC_API_KEY ?? '',
  blockedCountries:
    (process.env.KYC_BLOCKED_COUNTRIES ?? 'IR,KP,SY,CU,RU,BY')
      .split(',')
      .map((c) => c.trim().toUpperCase()),
}));
