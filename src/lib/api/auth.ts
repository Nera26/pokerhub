/* istanbul ignore file */
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
export type { ApiError } from './client';
import type { components } from '@/types/api';
import { LoginResponseSchema, MessageResponseSchema } from '@shared/types';

export async function login(
  email: string,
  password: string,
): Promise<components['schemas']['LoginResponse']> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    }),
    LoginResponseSchema,
  );
}

export async function logout(): Promise<components['schemas']['MessageResponse']> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }),
    MessageResponseSchema,
  );
}

export async function requestPasswordReset(
  email: string,
): Promise<components['schemas']['MessageResponse']> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/auth/request-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
    MessageResponseSchema,
  );
}

export async function verifyResetCode(
  email: string,
  code: string,
): Promise<components['schemas']['MessageResponse']> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    }),
    MessageResponseSchema,
  );
}

export async function resetPassword(
  email: string,
  code: string,
  password: string,
): Promise<components['schemas']['MessageResponse']> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    }),
    MessageResponseSchema,
  );
}
