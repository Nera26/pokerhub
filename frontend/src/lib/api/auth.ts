import { apiClient } from './client';
export type { ApiError } from './client';
import type { components } from '@contracts/api';
import {
  LoginResponseSchema,
  MessageResponseSchema,
  AuthProvidersResponseSchema,
} from '@shared/types';

export async function login(
  email: string,
  password: string,
): Promise<components['schemas']['LoginResponse']> {
  return apiClient('/api/auth/login', LoginResponseSchema, {
    method: 'POST',
    body: { email, password },
  });
}

export async function logout(): Promise<
  components['schemas']['MessageResponse']
> {
  return apiClient('/api/auth/logout', MessageResponseSchema, {
    method: 'POST',
  });
}

export async function requestPasswordReset(
  email: string,
): Promise<components['schemas']['MessageResponse']> {
  return apiClient('/api/auth/request-reset', MessageResponseSchema, {
    method: 'POST',
    body: { email },
  });
}

export async function verifyResetCode(
  email: string,
  code: string,
): Promise<components['schemas']['MessageResponse']> {
  return apiClient('/api/auth/verify-reset-code', MessageResponseSchema, {
    method: 'POST',
    body: { email, code },
  });
}

export async function resetPassword(
  email: string,
  code: string,
  password: string,
): Promise<components['schemas']['MessageResponse']> {
  return apiClient('/api/auth/reset-password', MessageResponseSchema, {
    method: 'POST',
    body: { email, code, password },
  });
}

export async function fetchAuthProviders({
  signal,
}: { signal?: AbortSignal } = {}): Promise<
  components['schemas']['AuthProvidersResponse']
> {
  return apiClient('/api/auth/providers', AuthProvidersResponseSchema, {
    signal,
  });
}
