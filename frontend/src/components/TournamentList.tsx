'use client';

import { Tournament } from '@/hooks/useLobbyData';
import TournamentCard, {
  type TournamentStatus,
} from '@/app/components/tournaments/TournamentCard';
import VirtualizedList from '@/components/VirtualizedList';

const ENTITY_ITEM_HEIGHT = 280;

export interface TournamentListProps<T extends Tournament> {
  tournaments: T[];
  hidden: boolean;
  onRegister?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export default function TournamentList<T extends Tournament>({
  tournaments,
  hidden,
  onRegister,
  onViewDetails,
}: TournamentListProps<T>) {
  const mapStatus = (state: T['state']): TournamentStatus => {
    switch (state) {
      case 'REG_OPEN':
        return 'upcoming';
      case 'RUNNING':
      case 'PAUSED':
        return 'running';
      case 'FINISHED':
      case 'CANCELLED':
      default:
        return 'past';
    }
  };

  return (
    <VirtualizedList<T>
      id="tournaments-panel"
      aria-labelledby="tab-tournaments"
      hidden={hidden}
      title="Tournaments"
      emptyMessage="No tournaments available."
      items={tournaments}
      estimateSize={ENTITY_ITEM_HEIGHT}
      className="h-96 overflow-auto"
      renderItem={(t, style) => (
        <li key={t.id} style={style} className="mb-4">
          <TournamentCard
            id={t.id}
            status={mapStatus(t.state)}
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
