import type { paths } from '@contracts/api';
import { ServiceStatusResponseSchema } from '@shared/types';

export type GetStatusResponse = paths['/status']['get']['responses']['200']['content']['application/json'];

export async function getStatus(baseUrl = ''): Promise<GetStatusResponse> {
  const res = await fetch(`${baseUrl}/status`);
  const json = await res.json();
  return ServiceStatusResponseSchema.parse(json);
}
