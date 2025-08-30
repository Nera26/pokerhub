import type { paths } from '@contracts/api';
import { ServiceStatusResponseSchema } from '@shared/types';

export type GetStatusResponse = paths['/status']['get']['responses']['200']['content']['application/json'];

const FALLBACK_STATUS: GetStatusResponse = {
  status: 'error',
  contractVersion: 'unknown',
};

export async function getStatus(baseUrl = ''): Promise<GetStatusResponse> {
  try {
    const res = await fetch(`${baseUrl}/status`);
    const json = await res.json();
    return ServiceStatusResponseSchema.parse(json);
  } catch {
    return FALLBACK_STATUS;
  }
}
