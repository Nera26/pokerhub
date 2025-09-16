'use client';

import { createGetHook } from './useApiQuery';
import { AuditSummarySchema, type AuditSummary } from '@shared/types';

export const useAuditSummary = createGetHook<AuditSummary>(
  '/api/analytics/summary',
  AuditSummarySchema,
);
