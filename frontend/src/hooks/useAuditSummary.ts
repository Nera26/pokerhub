'use client';

import { createQueryHook } from './useApiQuery';
import { AuditSummarySchema, type AuditSummary } from '@shared/types';

export const useAuditSummary = createQueryHook<AuditSummary>(
  'audit-summary',
  (client, opts) => client('/api/analytics/summary', AuditSummarySchema, opts),
  'audit summary',
);
