import type { AuditLogType } from '@shared/types';

export const TYPE_BADGE_CLASSES: Record<AuditLogType, string> = {
  Login: 'bg-success text-black',
  'Table Event': 'bg-accent text-black',
  Broadcast: 'bg-info text-white',
  Error: 'bg-danger text-white',
};
