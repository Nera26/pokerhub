'use client';

import { createLookupHook } from './createLookupHook';
import {
  AuditLogTypesResponseSchema,
  type AuditLogTypesResponse,
} from '@shared/types';

const useAuditLogTypes = createLookupHook<AuditLogTypesResponse>(
  '/api/admin/audit/log-types',
  AuditLogTypesResponseSchema,
);

export default useAuditLogTypes;
