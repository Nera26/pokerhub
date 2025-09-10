import { z } from 'zod';

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
  .refine(
    (env) =>
      env.NODE_ENV === 'development' ||
      env.NEXT_PUBLIC_BASE_URL ||
      env.VERCEL_URL,
    {
      message:
        'NEXT_PUBLIC_BASE_URL or VERCEL_URL is required when NODE_ENV is not development',
      path: ['NEXT_PUBLIC_BASE_URL'],
    },
  )
  .refine(
    (env) =>
      env.NODE_ENV === 'development' ||
      env.NEXT_PUBLIC_SOCKET_URL ||
      env.NEXT_PUBLIC_BASE_URL ||
      env.VERCEL_URL,
    {
      message:
        'NEXT_PUBLIC_SOCKET_URL is required when NODE_ENV is not development',
      path: ['NEXT_PUBLIC_SOCKET_URL'],
    },
  )
  .transform((env) => ({
    ...env,
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
