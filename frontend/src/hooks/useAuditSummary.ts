'use client';

import { AuditSummarySchema, type AuditSummary } from '@shared/types';
import useAuditQuery from './useAuditQuery';

export function useAuditSummary() {
  return useAuditQuery<AuditSummary>(
    '/api/analytics/summary',
    AuditSummarySchema,
    'audit-summary',
  );
}

