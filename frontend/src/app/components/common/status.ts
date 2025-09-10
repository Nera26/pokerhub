import type { StatusBadge } from '../dashboard/transactions/types';

export const STATUS_LABELS: Record<StatusBadge, string> = {
  pending: 'Pending',
  confirmed: 'Completed',
  rejected: 'Rejected',
};

export const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-accent-yellow/20 text-accent-yellow',
  Completed: 'bg-accent-green/20 text-accent-green',
  Rejected: 'bg-danger-red/20 text-danger-red',
  Failed: 'bg-danger-red/20 text-danger-red',
  Processing: 'bg-accent-yellow/20 text-accent-yellow',
  'Pending Confirmation': 'bg-accent-yellow/20 text-accent-yellow',
  Pending: 'bg-accent-yellow/20 text-accent-yellow',
};

export function getStatusInfo(status: string) {
  const label = STATUS_LABELS[status as StatusBadge] ?? status;
  const style = STATUS_STYLES[label] ?? 'bg-border-dark text-text-secondary';
  return { label, style };
}
