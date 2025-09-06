import { apiClient } from './client';
import { z } from 'zod';

const statusEnum = z.enum(['scheduled', 'running', 'finished', 'cancelled', 'auto-start']);
export const AdminTournamentSchema = z.object({
  id: z.number(),
  name: z.string(),
  gameType: z.string(),
  buyin: z.number(),
  fee: z.number(),
  prizePool: z.number(),
  date: z.string(),
  time: z.string(),
  format: z.string(),
  seatCap: z.union([z.number().int().positive(), z.literal('')]).optional(),
  description: z.string().optional(),
  rebuy: z.boolean(),
  addon: z.boolean(),
  status: statusEnum,
});
export type AdminTournament = z.infer<typeof AdminTournamentSchema>;
export const AdminTournamentListSchema = z.array(AdminTournamentSchema);

export async function fetchAdminTournaments({ signal }: { signal?: AbortSignal } = {}): Promise<AdminTournament[]> {
  return apiClient('/api/admin/tournaments', AdminTournamentListSchema, { signal });
}

export async function createAdminTournament(body: AdminTournament): Promise<AdminTournament> {
  return apiClient('/api/admin/tournaments', AdminTournamentSchema, {
    method: 'POST',
    body,
  });
}

export async function updateAdminTournament(id: number, body: AdminTournament): Promise<AdminTournament> {
  return apiClient(`/api/admin/tournaments/${id}`, AdminTournamentSchema, {
    method: 'PUT',
    body,
  });
}

export async function deleteAdminTournament(id: number): Promise<void> {
  await apiClient(`/api/admin/tournaments/${id}`, z.void(), { method: 'DELETE' });
}
