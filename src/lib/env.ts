import { z } from 'zod';

export const IS_E2E = process.env.NEXT_PUBLIC_E2E === '1';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    NEXT_PUBLIC_SOCKET_URL: z.string().url().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_E2E: z.string().optional(),
    VERCEL_URL: z.string().optional(),
    CI: z.string().optional(),
    NEXT_PUBLIC_LOG_LEVEL: z
      .enum(['error', 'warn', 'info', 'debug'])
      .default('info'),
  })
  .transform((env) => ({
    ...env,
    NEXT_PUBLIC_SOCKET_URL:
      env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000',
    NEXT_PUBLIC_BASE_URL: env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000',
    IS_E2E: env.NEXT_PUBLIC_E2E === '1',
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.errors
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${errors}`);
}

export const env = parsed.data;

export type Env = typeof env;
