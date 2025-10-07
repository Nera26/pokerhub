'use client';

import { memo } from 'react';
import { Tournament } from '@/hooks/useLobbyData';
import TournamentCard, {
  type TournamentStatus,
} from '@/components/tournaments/tournament-card';
import VirtualizedList from '@/components/virtualized-list';
import { TournamentStateMap } from '@shared/types';

export interface TournamentListProps<T extends Tournament> {
  tournaments: T[];
  hidden: boolean;
  onRegister?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

function TournamentListComponent<T extends Tournament>({
  tournaments,
  hidden,
  onRegister,
  onViewDetails,
}: TournamentListProps<T>) {
  return (
    <VirtualizedList<T>
      id="tournaments-panel"
      aria-labelledby="tab-tournaments"
      hidden={hidden}
      title="Tournaments"
      emptyMessage="No tournaments available."
      items={tournaments}
      className="h-96 overflow-auto"
      renderItem={(t, style) => (
        <li key={t.id} style={style} className="mb-4">
          <TournamentCard
            id={t.id}
            status={TournamentStateMap[t.state] as TournamentStatus}
            name={t.title}
            gameType={t.gameType}
            buyin={t.buyIn + (t.fee ?? 0)}
            rebuy={t.fee !== undefined ? `$${t.fee.toLocaleString()}` : 'None'}
            prizepool={t.prizePool}
            players={t.players.current}
            maxPlayers={t.players.max}
            onRegister={onRegister}
            onViewDetails={onViewDetails}
            registered={t.registered}
          />
        </li>
      )}
    />
  );
}

const TournamentList = memo(TournamentListComponent) as typeof TournamentListComponent;

export default TournamentList;
