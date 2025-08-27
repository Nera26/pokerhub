import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from './client';
import {
  CalculatePrizesRequest,
  CalculatePrizesResponse,
  CalculatePrizesResponseSchema,
} from '@shared/types';

export async function calculatePrizes(
  id: string,
  body: CalculatePrizesRequest,
  { signal }: { signal?: AbortSignal } = {},
): Promise<CalculatePrizesResponse> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/tournaments/${id}/prizes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal,
    });
    if (!res.ok) {
      const details = await res.text().catch(() => undefined);
      throw { status: res.status, message: res.statusText, details } as ApiError;
    }
    return await handleResponse(res, CalculatePrizesResponseSchema);
  } catch (err) {
    if (err instanceof Error) {
      throw { message: `Failed to calculate prizes: ${err.message}` } as ApiError;
    }
    throw err as ApiError;
  }
}

