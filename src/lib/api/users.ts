import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
import { MessageResponse, MessageResponseSchema } from './schemas';
export type { ApiError } from './client';

export interface NewUser {
  username: string;
  email: string;
  password: string;
  balance: number;
  status: string;
}

export interface UpdateUser {
  id: number;
  name: string;
  email: string;
  balance: number;
  status: string;
}

export interface BalanceParams {
  amount: number;
  action: 'add' | 'remove' | 'freeze';
  notes: string;
}

export async function createUser(newUser: NewUser): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newUser),
    }),
    MessageResponseSchema,
  );
}

export async function updateUser(
  updated: UpdateUser,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/users/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updated),
    }),
    MessageResponseSchema,
  );
}

export async function toggleUserBan(userId: number): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/users/${userId}/ban`, {
      method: 'POST',
      credentials: 'include',
    }),
    MessageResponseSchema,
  );
}

export async function updateUserBalance(
  userId: number,
  params: BalanceParams,
): Promise<MessageResponse> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/users/${userId}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(params),
    }),
    MessageResponseSchema,
  );
}
