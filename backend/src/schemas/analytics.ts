import { z } from 'zod';

export const AuditLogTypeSchema = z.enum(['Login', 'Table Event', 'Broadcast', 'Error']);
export type AuditLogType = z.infer<typeof AuditLogTypeSchema>;

export const AuditLogEntrySchema = z.object({
  id: z.number().int(),
  timestamp: z.string().datetime(),
  type: AuditLogTypeSchema,
  description: z.string(),
  user: z.string(),
  ip: z.string(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

export const AuditLogsResponseSchema = z.object({
  logs: z.array(AuditLogEntrySchema),
  nextCursor: z.number().int().nullable().optional(),
});
export type AuditLogsResponse = z.infer<typeof AuditLogsResponseSchema>;

export const AuditSummarySchema = z.object({
  total: z.number().int(),
  errors: z.number().int(),
  logins: z.number().int(),
});
export type AuditSummary = z.infer<typeof AuditSummarySchema>;

export const AuditLogsQuerySchema = z.object({
  cursor: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AuditLogsQuery = z.infer<typeof AuditLogsQuerySchema>;
