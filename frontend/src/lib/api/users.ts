/* istanbul ignore file */
import { apiClient } from './client';
import { MessageResponse, MessageResponseSchema } from '@shared/types';
import { z } from 'zod';
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

// Dashboard helpers
const DashboardUserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  balance: z.number(),
  status: z.enum(['Active', 'Frozen', 'Banned']),
  avatar: z.string().optional(),
});
export type DashboardUser = z.infer<typeof DashboardUserSchema>;

export async function createUser(newUser: NewUser): Promise<DashboardUser> {
  return apiClient('/api/users', DashboardUserSchema, {
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

export async function fetchUsers({
  signal,
}: { signal?: AbortSignal } = {}) {
  return apiClient(
    '/api/admin/users',
    z.array(DashboardUserSchema),
    { signal },
  );
}

