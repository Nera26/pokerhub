import { apiClient, type ApiError } from './client';
import { z } from 'zod';
import { MessageResponseSchema } from '@shared/types';

/** =======================
 *  Admin Tournaments
 *  ======================= */
const statusEnum = z.enum([
  'scheduled',
  'running',
  'finished',
  'cancelled',
  'auto-start',
]);

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

export async function fetchAdminTournaments({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<AdminTournament[]> {
  return apiClient('/api/admin/tournaments', AdminTournamentListSchema, {
    signal,
  });
}

export async function createAdminTournament(
  body: AdminTournament,
): Promise<AdminTournament> {
  return apiClient('/api/admin/tournaments', AdminTournamentSchema, {
    method: 'POST',
    body,
  });
}

export async function updateAdminTournament(
  id: number,
  body: AdminTournament,
): Promise<AdminTournament> {
  return apiClient(`/api/admin/tournaments/${id}`, AdminTournamentSchema, {
    method: 'PUT',
    body,
  });
}

export async function deleteAdminTournament(id: number): Promise<void> {
  // Validate server response shape but return void to callers
  await apiClient(
    `/api/admin/tournaments/${id}`,
    MessageResponseSchema,
    { method: 'DELETE' },
  );
}

/** =======================
 *  Admin Bonuses
 *  ======================= */
export const BonusSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  type: z.enum(['deposit', 'rakeback', 'ticket', 'rebate', 'first-deposit']),
  description: z.string(),
  bonusPercent: z.number().optional(),
  maxBonusUsd: z.number().optional(),
  expiryDate: z.string().optional(),
  eligibility: z.enum(['all', 'new', 'vip', 'active']),
  status: z.enum(['active', 'paused']),
  claimsTotal: z.number(),
  claimsWeek: z.number().optional(),
});

export type Bonus = z.infer<typeof BonusSchema>;

export async function fetchBonuses({ signal }: { signal?: AbortSignal } = {}) {
  try {
    return await apiClient('/api/admin/bonuses', z.array(BonusSchema), {
      signal,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch bonuses: ${message}` } as ApiError;
  }
}

export async function createBonus(
  bonus: Omit<Bonus, 'id' | 'claimsTotal' | 'claimsWeek'>,
) {
  return apiClient('/api/admin/bonuses', BonusSchema, {
    method: 'POST',
    body: bonus,
  });
}

export async function updateBonus(id: number, bonus: Partial<Bonus>) {
  return apiClient(`/api/admin/bonuses/${id}`, BonusSchema, {
    method: 'PUT',
    body: bonus,
  });
}

export async function deleteBonus(id: number) {
  return apiClient(`/api/admin/bonuses/${id}`, MessageResponseSchema, {
    method: 'DELETE',
  });
}
