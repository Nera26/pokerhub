'use client';

import { Tournament } from '@/hooks/useLobbyData';
import VirtualizedList from '@/components/VirtualizedList';
import TournamentCard, {
  type TournamentStatus,
} from '@/app/components/tournaments/TournamentCard';

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
    <section
      id="tournaments-panel"
      role="tabpanel"
      aria-labelledby="tab-tournaments"
      hidden={hidden}
    >
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
        Tournaments
      </h2>

      {tournaments.length === 0 ? (
        <p>No tournaments available.</p>
      ) : (
        <VirtualizedList
          items={tournaments}
          estimateSize={280}
          className="h-96 overflow-auto"
          testId="tournaments-list"
          renderItem={(t, style) => (
            <li key={t.id} style={style} className="mb-4">
              <TournamentCard
                id={t.id}
                status={mapStatus(t.state)}
                name={t.title}
                gameType="Unknown"
                buyin={t.buyIn + (t.fee ?? 0)}
                rebuy="N/A"
                prizepool={t.prizePool}
                players={t.players.current}
                maxPlayers={t.players.max}
                onRegister={onRegister}
                onViewDetails={onViewDetails}
              />
            </li>
          )}
        />
      )}
    </section>
  );
}
