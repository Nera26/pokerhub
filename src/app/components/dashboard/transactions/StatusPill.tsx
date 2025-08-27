import type { StatusBadge } from './types';

export type Status = 'pending' | 'completed' | 'rejected';

const STATUS_STYLES: Record<Status, string> = {
  pending: 'bg-accent-yellow text-black',
  completed: 'bg-accent-green text-white',
  rejected: 'bg-danger-red text-white',
};

export const toStatus = (s: StatusBadge): Status => s.toLowerCase() as Status;

export default function StatusPill({ status }: { status: Status }) {
  const label = status[0].toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}
