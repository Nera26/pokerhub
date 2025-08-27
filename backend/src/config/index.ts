import 'dotenv/config';

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/pokerhub';
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
