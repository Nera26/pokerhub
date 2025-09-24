import { apiClient } from './client';
import {
  BonusDefaultsResponseSchema,
  type BonusDefaultsResponse,
  BonusDefaultsRequestSchema,
  type BonusDefaultsRequest,
  MessageResponseSchema,
  type MessageResponse,
  BonusStatsResponseSchema,
  type BonusStatsResponse,
} from '@shared/types';

export async function fetchBonusDefaults({
  signal,
}: { signal?: AbortSignal } = {}): Promise<BonusDefaultsResponse> {
  return apiClient('/api/admin/bonus/defaults', BonusDefaultsResponseSchema, {
    signal,
  });
}

export async function fetchBonusStats({
  signal,
}: { signal?: AbortSignal } = {}): Promise<BonusStatsResponse> {
  return apiClient('/api/admin/bonus/stats', BonusStatsResponseSchema, {
    signal,
  });
}

export async function createBonusDefaults(
  body: BonusDefaultsRequest,
): Promise<BonusDefaultsResponse> {
  return apiClient('/api/admin/bonus/defaults', BonusDefaultsResponseSchema, {
    method: 'POST',
    body: BonusDefaultsRequestSchema.parse(body),
  });
}

export async function updateBonusDefaults(
  body: BonusDefaultsRequest,
): Promise<BonusDefaultsResponse> {
  return apiClient('/api/admin/bonus/defaults', BonusDefaultsResponseSchema, {
    method: 'PUT',
    body: BonusDefaultsRequestSchema.parse(body),
  });
}

export async function deleteBonusDefaults(): Promise<MessageResponse> {
  return apiClient('/api/admin/bonus/defaults', MessageResponseSchema, {
    method: 'DELETE',
  });
}
