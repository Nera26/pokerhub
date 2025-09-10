import { apiClient } from './client';
import {
  ChipDenominationsResponseSchema,
  type ChipDenominationsResponse,
} from '@shared/types';

export async function fetchChipDenominations({
  signal,
}: { signal?: AbortSignal } = {}): Promise<ChipDenominationsResponse> {
  return apiClient('/api/config/chips', ChipDenominationsResponseSchema, {
    signal,
  });
}

export async function updateChipDenominations(
  denoms: number[],
  { signal }: { signal?: AbortSignal } = {},
): Promise<ChipDenominationsResponse> {
  return apiClient('/api/config/chips', ChipDenominationsResponseSchema, {
    method: 'PUT',
    body: JSON.stringify({ denoms }),
    signal,
  });
}
