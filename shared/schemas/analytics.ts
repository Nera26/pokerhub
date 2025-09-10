import { z } from 'zod';

export const AUDIT_LOG_TYPES = [
  'Login',
  'Table Event',
  'Broadcast',
  'Error',
] as const;

export const AuditLogTypeSchema = z.enum(AUDIT_LOG_TYPES);
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
  total: z.number().int(),
});
export type AuditLogsResponse = z.infer<typeof AuditLogsResponseSchema>;

export const AuditLogTypesResponseSchema = z.object({
  types: z.array(AuditLogTypeSchema),
});
export type AuditLogTypesResponse = z.infer<typeof AuditLogTypesResponseSchema>;

export const AuditSummarySchema = z.object({
  total: z.number().int(),
  errors: z.number().int(),
  logins: z.number().int(),
});
export type AuditSummary = z.infer<typeof AuditSummarySchema>;

export const AuditLogsQuerySchema = z.object({
  search: z.string().optional(),
  type: AuditLogTypeSchema.optional(),
  user: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AuditLogsQuery = z.infer<typeof AuditLogsQuerySchema>;

export const AlertItemSchema = z.object({
  id: z.string(),
  severity: z.enum(['danger', 'warning']),
  title: z.string(),
  body: z.string(),
  time: z.string(),
  resolved: z.boolean().optional(),
});
export type AlertItem = z.infer<typeof AlertItemSchema>;

export const SecurityAlertsResponseSchema = z.array(AlertItemSchema);
export type SecurityAlertsResponse = z.infer<typeof SecurityAlertsResponseSchema>;

export const AdminOverviewSchema = z.object({
  name: z.string(),
  avatar: z.string(),
  lastAction: z.string(),
  total24h: z.number().int(),
  login: z.string(),
  loginTitle: z.string().optional(),
});
export type AdminOverview = z.infer<typeof AdminOverviewSchema>;

export const AdminOverviewResponseSchema = z.array(AdminOverviewSchema);
export type AdminOverviewResponse = z.infer<typeof AdminOverviewResponseSchema>;

export const RevenueStreamSchema = z.object({
  label: z.string(),
  pct: z.number(),
  value: z.number().optional(),
});
export type RevenueStream = z.infer<typeof RevenueStreamSchema>;

export const RevenueBreakdownSchema = z.array(RevenueStreamSchema);
export type RevenueBreakdown = z.infer<typeof RevenueBreakdownSchema>;

export const ActivityResponseSchema = z.object({
  labels: z.array(z.string()),
  data: z.array(z.number()),
});
export type ActivityResponse = z.infer<typeof ActivityResponseSchema>;
