/* istanbul ignore file */
import { apiClient } from './client';
import { MessageResponse, MessageResponseSchema } from '@shared/types';
export type { ApiError } from './client';

export interface NewUser {
  username: string;
  email: string;
  password: string;
  status: string;
}

export interface UpdateUser {
  id: number;
  name: string;
  email: string;
  status: string;
}

export async function createUser(newUser: NewUser): Promise<MessageResponse> {
  return apiClient('/api/users', MessageResponseSchema, {
    method: 'POST',
    body: newUser,
  });
}

export async function updateUser(
  updated: UpdateUser,
): Promise<MessageResponse> {
  return apiClient(`/api/users/${updated.id}`, MessageResponseSchema, {
    method: 'PUT',
    body: updated,
  });
}

export async function toggleUserBan(userId: number): Promise<MessageResponse> {
  return apiClient(`/api/users/${userId}/ban`, MessageResponseSchema, {
    method: 'POST',
  });
}
