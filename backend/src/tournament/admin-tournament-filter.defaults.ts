import type { AdminTournamentFilterOption } from '@shared/types';

export const DEFAULT_ADMIN_TOURNAMENT_FILTERS: AdminTournamentFilterOption[] = [
  { id: 'all', label: 'All' },
  {
    id: 'scheduled',
    label: 'Scheduled',
    colorClass: 'border-accent-blue text-accent-blue',
  },
  {
    id: 'auto-start',
    label: 'Auto-start',
    colorClass: 'border-accent-blue text-accent-blue',
  },
  {
    id: 'running',
    label: 'Running',
    colorClass: 'border-accent-green text-accent-green',
  },
  {
    id: 'finished',
    label: 'Finished',
    colorClass: 'border-text-secondary text-text-secondary',
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    colorClass: 'border-red-500 text-red-500',
  },
];
