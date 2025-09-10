'use client';

import { createResourceHook } from './createResourceHook';
import { AuditSummarySchema, type AuditSummary } from '@shared/types';

export const useAuditSummary = createResourceHook<AuditSummary>(
  'audit-summary',
  (client, opts) => client('/api/analytics/summary', AuditSummarySchema, opts),
  'audit summary',
);
