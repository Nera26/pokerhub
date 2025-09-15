'use client';

import { createGetHook } from './useApiQuery';
import {
  AuditLogTypesResponseSchema,
  type AuditLogTypesResponse,
} from '@shared/types';

const useAuditLogTypes = createGetHook<AuditLogTypesResponse>(
  '/api/admin/audit/log-types',
  AuditLogTypesResponseSchema,
);

export default useAuditLogTypes;
