'use client';

import { createSimpleGetHook } from './useSimpleGet';
import { AuditSummarySchema } from '@shared/types';

export const useAuditSummary = createSimpleGetHook(
  '/api/analytics/summary',
  AuditSummarySchema,
);
