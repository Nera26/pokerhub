import { env } from './env';

export function getBaseUrl() {
  if (env.NEXT_PUBLIC_BASE_URL) {
    return env.NEXT_PUBLIC_BASE_URL;
  }
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
