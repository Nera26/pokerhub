import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5432/pokerhub',
  synchronize: process.env.DB_SYNC === 'true',
}));
