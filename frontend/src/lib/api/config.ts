import { apiClient } from './client';
import {
  ChipDenominationsResponseSchema,
  type ChipDenominationsResponse,
  PerformanceThresholdsResponseSchema,
  type PerformanceThresholdsResponse,
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

export async function fetchPerformanceThresholds({
  signal,
}: { signal?: AbortSignal } = {}): Promise<PerformanceThresholdsResponse> {
  return apiClient(
    '/api/config/performance-thresholds',
    PerformanceThresholdsResponseSchema,
    { signal },
  );
}
