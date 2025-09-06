import { apiClient, type ApiError } from './client';
import { z } from 'zod';
import { MessageResponseSchema } from '@shared/types';

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
    const message = err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch bonuses: ${message}` } as ApiError;
  }
}

export async function createBonus(bonus: Omit<Bonus, 'id' | 'claimsTotal' | 'claimsWeek'>) {
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
