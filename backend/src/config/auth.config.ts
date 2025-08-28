import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '300', 10),
  refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '3600', 10),
}));
