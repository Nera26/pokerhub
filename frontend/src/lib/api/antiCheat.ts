import { apiClient } from './client';
import {
  AntiCheatFlagSchema,
  AntiCheatFlagsResponseSchema,
  AntiCheatFlagUpdateRequestSchema,
  AntiCheatNextActionResponseSchema,
  type AntiCheatFlag,
  type AntiCheatReviewAction,
  type AntiCheatReviewStatus,
} from '@shared/types';

export type Flag = AntiCheatFlag;

export async function fetchFlags(): Promise<Flag[]> {
  return apiClient('/api/anti-cheat/flags', AntiCheatFlagsResponseSchema);
}

export async function updateFlag(
  id: string,
  action: AntiCheatReviewAction,
): Promise<Flag> {
  AntiCheatFlagUpdateRequestSchema.parse({ action });
  return apiClient(`/api/anti-cheat/flags/${id}`, AntiCheatFlagSchema, {
    method: 'PUT',
    body: { action },
  });
}

export async function fetchNextAction(
  status: AntiCheatReviewStatus,
): Promise<AntiCheatReviewAction | null> {
  const { next } = await apiClient(
    `/api/anti-cheat/next-action?current=${status}`,
    AntiCheatNextActionResponseSchema,
  );
  return next;
}
