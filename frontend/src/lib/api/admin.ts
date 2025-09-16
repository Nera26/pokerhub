import { apiClient, type ApiError } from './client';
import { z } from 'zod';
import { OptionSchema } from '@shared/option.schema';
import {
  MessageResponseSchema,
  AdminTournamentSchema,
  type AdminTournament,
  BonusOptionsResponseSchema,
  type BonusOptionsResponse,
  AdminTabResponseSchema,
  type AdminTab,
  AdminTabSchema,
  AdminTabCreateRequestSchema,
  type CreateAdminTabRequest,
  AdminTabUpdateRequestSchema,
  type UpdateAdminTabRequest,
  TournamentFormatsResponseSchema,
  type TournamentFormatsResponse,
  UserMetaResponseSchema,
  type UserMetaResponse,
} from '@shared/types';
import { DashboardUserSchema, type DashboardUser } from '@shared/types';
import type { CreateUserRequest } from '@shared/types';
export { AdminTournamentSchema } from '@shared/types';
export type { AdminTournament } from '@shared/types';
export type Option = z.infer<typeof OptionSchema>;

/** =======================
 *  Admin Tournaments
 *  ======================= */
export const AdminTournamentListSchema = z.array(AdminTournamentSchema);

export async function fetchAdminTabs({
  signal,
}: { signal?: AbortSignal } = {}): Promise<AdminTab[]> {
  return apiClient('/api/admin/tabs', AdminTabResponseSchema, { signal });
}

export async function createAdminTab(
  body: CreateAdminTabRequest,
): Promise<AdminTab> {
  return apiClient('/api/admin/tabs', AdminTabSchema, {
    method: 'POST',
    body: AdminTabCreateRequestSchema.parse(body),
  });
}

export async function updateAdminTab(
  id: string,
  body: UpdateAdminTabRequest,
): Promise<AdminTab> {
  return apiClient(`/api/admin/tabs/${id}`, AdminTabSchema, {
    method: 'PUT',
    body: AdminTabUpdateRequestSchema.parse(body),
  });
}

export async function deleteAdminTab(id: string): Promise<void> {
  await apiClient(`/api/admin/tabs/${id}`, z.void(), { method: 'DELETE' });
}

const AdminTabMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  component: z.string(),
  enabled: z.boolean(),
  message: z.string(),
});

export type AdminTabMeta = z.infer<typeof AdminTabMetaSchema>;

export async function fetchAdminTabMeta(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<AdminTabMeta> {
  return apiClient(`/api/admin/tabs/${id}`, AdminTabMetaSchema, { signal });
}

export async function acknowledgeAdminEvent(id: string): Promise<void> {
  await apiClient(`/api/admin/events/${id}/ack`, MessageResponseSchema, {
    method: 'POST',
  });
}

export async function fetchDashboardUsers({
  signal,
  limit = 5,
}: { signal?: AbortSignal; limit?: number } = {}): Promise<DashboardUser[]> {
  return apiClient(
    `/api/admin/users?limit=${limit}`,
    z.array(DashboardUserSchema),
    { signal },
  );
}

export async function fetchUserMeta({
  signal,
}: { signal?: AbortSignal } = {}): Promise<UserMetaResponse> {
  return apiClient('/api/admin/users/meta', UserMetaResponseSchema, {
    signal,
  });
}

export async function createAdminUser(
  body: CreateUserRequest,
): Promise<DashboardUser> {
  return apiClient('/api/admin/users', DashboardUserSchema, {
    method: 'POST',
    body,
  });
}

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
  await apiClient(`/api/admin/tournaments/${id}`, MessageResponseSchema, {
    method: 'DELETE',
  });
}

export async function fetchAdminTournamentDefaults({
  signal,
}: { signal?: AbortSignal } = {}): Promise<AdminTournament> {
  return apiClient('/api/admin/tournaments/defaults', AdminTournamentSchema, {
    signal,
  });
}

export async function fetchTournamentFormats({
  signal,
}: { signal?: AbortSignal } = {}): Promise<TournamentFormatsResponse> {
  return apiClient(
    '/api/admin/tournaments/formats',
    TournamentFormatsResponseSchema,
    { signal },
  );
}

/** =======================
 *  Admin Bonuses
 *  ======================= */
export async function fetchBonusOptions({
  signal,
}: { signal?: AbortSignal } = {}): Promise<BonusOptionsResponse> {
  return apiClient('/api/admin/bonus/options', BonusOptionsResponseSchema, {
    signal,
  });
}

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
