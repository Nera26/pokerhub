import { AUDIT_LOG_TYPES, type AuditLogType } from '@shared/types';
import { getBaseUrl } from '@/lib/base-url';
import { serverFetch } from '@/lib/server-fetch';

export const LOG_TYPES = AUDIT_LOG_TYPES;

export const TYPE_BADGE_CLASSES: Record<AuditLogType, string> = {
  Login: 'bg-success text-black',
  'Table Event': 'bg-accent text-black',
  Broadcast: 'bg-info text-white',
  Error: 'bg-danger text-white',
};

export async function loadTypeBadgeClasses() {
  try {
    const baseUrl = getBaseUrl();
    const res = await serverFetch(`${baseUrl}/api/admin/log-types`);
    if (!res.ok) return;
    const data = (await res.json()) as Record<AuditLogType, string>;
    Object.assign(TYPE_BADGE_CLASSES, data);
  } catch {
    // ignore failure and keep defaults
  }
}
