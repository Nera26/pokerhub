import { apiClient } from './client';
import {
  ChipDenominationsResponseSchema,
  type ChipDenominationsResponse,
  TableThemeResponseSchema,
  type TableThemeResponse,
} from '@shared/types';

export async function fetchChipDenominations({
  signal,
}: { signal?: AbortSignal } = {}): Promise<ChipDenominationsResponse> {
  return apiClient('/api/config/chips', ChipDenominationsResponseSchema, {
    signal,
  });
}

export async function fetchTableTheme({
  signal,
}: { signal?: AbortSignal } = {}): Promise<TableThemeResponse> {
  return apiClient('/api/config/table-theme', TableThemeResponseSchema, {
    signal,
  });
}
