import createClient from 'openapi-fetch';
import type { paths } from '@contracts/api';
import { getBaseUrl } from '@/lib/base-url';
import { useAuthStore } from '@/app/store/authStore';

export function createApiClient() {
  const baseUrl = getBaseUrl();
  const token = useAuthStore.getState().token;
  const headers: HeadersInit = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  return createClient<paths>({ baseUrl, headers });
}

export type ApiClient = ReturnType<typeof createApiClient>;
