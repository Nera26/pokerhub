import { registerAs } from '@nestjs/config';

export default registerAs('kyc', () => ({
  apiUrl: process.env.KYC_API_URL ?? '',
  apiKey: process.env.KYC_API_KEY ?? '',
}));
