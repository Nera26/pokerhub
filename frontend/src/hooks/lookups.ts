'use client';

import { createGetHook } from './useApiQuery';
import {
  BroadcastTypesResponseSchema,
  type BroadcastTypesResponse,
  AuditLogTypesResponseSchema,
  type AuditLogTypesResponse,
  LogTypeClassesSchema,
  type LogTypeClasses,
} from '@shared/types';

export const useBroadcastTypes = createGetHook<BroadcastTypesResponse>(
  '/api/broadcasts/types',
  BroadcastTypesResponseSchema,
);

export const useAuditLogTypes = createGetHook<AuditLogTypesResponse>(
  '/api/analytics/log-types',
  AuditLogTypesResponseSchema,
);

export const useAuditLogTypeClasses = createGetHook<LogTypeClasses>(
  '/api/analytics/log-types/classes',
  LogTypeClassesSchema,
);
