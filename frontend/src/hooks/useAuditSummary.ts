'use client';

import { useAuditQuery } from './useAuditQuery';
import { AuditSummarySchema, type AuditSummary } from '@shared/types';

export function useAuditSummary() {
  return useAuditQuery<AuditSummary>(
    'audit-summary',
    '/api/analytics/summary',
    AuditSummarySchema,
  );
}
