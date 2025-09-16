import { z } from 'zod';
import {
  BlockedCountrySchema,
  BlockedCountriesResponseSchema,
  type BlockedCountry,
} from '@shared/types';
import { apiClient } from './client';

export async function fetchBlockedCountries({
  signal,
}: { signal?: AbortSignal } = {}): Promise<BlockedCountry[]> {
  return apiClient(
    '/api/admin/blocked-countries',
    BlockedCountriesResponseSchema,
    { signal },
  );
}

export async function createBlockedCountry(
  country: BlockedCountry,
): Promise<BlockedCountry> {
  const payload = BlockedCountrySchema.parse(country);
  return apiClient('/api/admin/blocked-countries', BlockedCountrySchema, {
    method: 'POST',
    body: payload,
  });
}

export async function updateBlockedCountry(
  current: string,
  country: BlockedCountry,
): Promise<BlockedCountry> {
  const code = BlockedCountrySchema.shape.country.parse(current);
  const payload = BlockedCountrySchema.parse(country);
  return apiClient(
    `/api/admin/blocked-countries/${code}`,
    BlockedCountrySchema,
    {
      method: 'PUT',
      body: payload,
    },
  );
}

export async function deleteBlockedCountry(country: string): Promise<void> {
  const code = BlockedCountrySchema.shape.country.parse(country);
  await apiClient(`/api/admin/blocked-countries/${code}`, z.void(), {
    method: 'DELETE',
  });
}
