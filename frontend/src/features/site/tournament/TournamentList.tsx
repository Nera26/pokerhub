'use client';

import { Tournament } from '@/hooks/useLobbyData';
import TournamentListBase, {
  type TournamentListProps as BaseProps,
} from '@/components/TournamentList';
import useRenderCount from '@/hooks/useRenderCount';
import { registerTournament } from '@/lib/api/lobby';

export type TournamentListProps<T extends Tournament> = BaseProps<T>;

export default function TournamentList<T extends Tournament>({
  tournaments,
  hidden,
  onRegister,
  onViewDetails,
}: TournamentListProps<T>) {
  useRenderCount('SiteTournamentList');

  const handleRegister = async (id: string) => {
    try {
      await registerTournament(id);
    } catch {
      // ignore errors for now
    }
  };

  return (
    <TournamentListBase
      tournaments={tournaments}
      hidden={hidden}
      onRegister={onRegister ?? handleRegister}
      onViewDetails={onViewDetails}
    />
  );
}

