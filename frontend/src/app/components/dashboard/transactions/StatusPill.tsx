import type { StatusBadge } from './types';
import StatusPillBase from '../common/StatusPill';

export type Status = 'pending' | 'completed' | 'rejected';

const STATUS_STYLES: Record<Status, string> = {
  pending: 'bg-accent-yellow text-black',
  completed: 'bg-accent-green text-white',
  rejected: 'bg-danger-red text-white',
};

export const toStatus = (s: StatusBadge): Status => s.toLowerCase() as Status;

export default function StatusPill({ status }: { status: Status }) {
  const label = status[0].toUpperCase() + status.slice(1);
  return <StatusPillBase label={label} className={STATUS_STYLES[status]} />;
}
