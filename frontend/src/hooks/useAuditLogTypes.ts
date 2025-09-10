import { createQueryHook } from './useApiQuery';
import { apiClient } from '@/lib/api/client';
import {
  AuditLogTypesResponseSchema,
  type AuditLogTypesResponse,
} from '@shared/types';

const fetchAuditLogTypes = (
  _client: typeof apiClient,
  opts: { signal?: AbortSignal },
) => apiClient('/api/admin/audit/log-types', AuditLogTypesResponseSchema, opts);

const useAuditLogTypes = createQueryHook<AuditLogTypesResponse>(
  'audit-log-types',
  fetchAuditLogTypes,
  'audit log types',
);

export default useAuditLogTypes;
