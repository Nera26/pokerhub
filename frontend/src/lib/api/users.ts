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

// Dashboard helpers
const DashboardUserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  balance: z.number(),
  status: z.enum(['Active', 'Frozen', 'Banned']),
  avatar: z.string(),
});

export async function fetchUsers({
  signal,
}: { signal?: AbortSignal } = {}) {
  return apiClient(
    '/api/admin/users',
    z.array(DashboardUserSchema),
    { signal },
  );
}

const TransactionEntrySchema = z.object({
  date: z.string(),
  action: z.string(),
  amount: z.number(),
  performedBy: z.string(),
  notes: z.string(),
  status: z.enum(['Completed', 'Pending', 'Rejected']),
});

export async function fetchUserTransactions(
  userId: number,
  { signal }: { signal?: AbortSignal } = {},
) {
  return apiClient(
    `/api/admin/users/${userId}/transactions`,
    z.array(TransactionEntrySchema),
    { signal },
  );
}
