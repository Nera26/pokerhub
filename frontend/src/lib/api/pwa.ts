import {
  PrecacheListResponseSchema,
  type PrecacheListResponse,
} from '@shared/schemas/precache';

export async function fetchPrecacheManifest(
  init?: RequestInit,
): Promise<PrecacheListResponse> {
  const response = await fetch('/api/precache-manifest', {
    credentials: 'same-origin',
    ...init,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch precache manifest: ${response.status} ${response.statusText}`.trim(),
    );
  }

  const data = await response.json();
  return PrecacheListResponseSchema.parse(data);
}
