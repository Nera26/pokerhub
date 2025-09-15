import type { components } from '@contracts/api';
import type { Tournament } from '@shared/types';
import type { TournamentStatus } from '@/app/components/tournaments/TournamentCard';

const statusMap: Record<
  components['schemas']['Tournament']['state'],
  TournamentStatus
> = {
  REG_OPEN: 'upcoming',
  RUNNING: 'running',
  PAUSED: 'running',
  FINISHED: 'past',
  CANCELLED: 'past',
};

export interface MappedTournament extends Tournament {
  status: TournamentStatus;
}

export function mapApiTournament(
  t: components['schemas']['Tournament'],
): MappedTournament {
  return {
    ...t,
    status: statusMap[t.state],
  };
}
