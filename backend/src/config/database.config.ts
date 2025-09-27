import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const localPort = process.env.DB_HOST_PORT ?? process.env.DB_PORT ?? '5432';

  return {
    url:
      process.env.DATABASE_URL ??
      `postgres://postgres:postgres@localhost:${localPort}/pokerhub`,
    synchronize: process.env.DB_SYNC === 'true',
  };
});
