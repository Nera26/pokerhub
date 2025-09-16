'use client';

import { createGetHook } from './useApiQuery';
import {
  BroadcastTypesResponseSchema,
  type BroadcastTypesResponse,
  AuditLogTypesResponseSchema,
  type AuditLogTypesResponse,
} from '@shared/types';

export const useBroadcastTypes = createGetHook<BroadcastTypesResponse>(
  '/api/broadcasts/types',
  BroadcastTypesResponseSchema,
);

export const useAuditLogTypes = createGetHook<AuditLogTypesResponse>(
  '/api/admin/audit/log-types',
  AuditLogTypesResponseSchema,
);
