import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecrets: (process.env.JWT_SECRETS ?? 'dev-secret').split(','),
  accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '300', 10),
  refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '3600', 10),
  providers: [
    { name: 'google', url: '/auth/google', label: 'Google' },
    { name: 'facebook', url: '/auth/facebook', label: 'Facebook' },
  ],
}));
