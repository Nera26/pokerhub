import { apiClient } from './client';
import {
  ChipDenominationsResponseSchema,
  PerformanceThresholdsResponseSchema,
} from '@shared/types';
import type { paths } from '@contracts/api';

type ChipDenominationsResponse =
  paths['/config/chips']['get']['responses']['200']['content']['application/json'];
type PerformanceThresholdsResponse =
  paths['/config/performance-thresholds']['get']['responses']['200']['content']['application/json'];

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

export async function updatePerformanceThresholds(
  thresholds: PerformanceThresholdsResponse,
  { signal }: { signal?: AbortSignal } = {},
): Promise<PerformanceThresholdsResponse> {
  return apiClient(
    '/api/config/performance-thresholds',
    PerformanceThresholdsResponseSchema,
    {
      method: 'PUT',
      body: JSON.stringify(thresholds),
      signal,
    },
  );
}
