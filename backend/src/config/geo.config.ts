import { registerAs } from '@nestjs/config';

export default registerAs('geo', () => ({
  allowedCountries: (process.env.ALLOWED_COUNTRIES ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean),
}));
