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
