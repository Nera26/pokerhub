import { env } from './env';

export function getBaseUrl() {
  if (env.NEXT_PUBLIC_BASE_URL) {
    return env.NEXT_PUBLIC_BASE_URL;
  }
  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  throw new Error(
    'Base URL could not be determined: set NEXT_PUBLIC_BASE_URL or VERCEL_URL',
  );
}
