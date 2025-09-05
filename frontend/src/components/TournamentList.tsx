'use client';

import { useRef } from 'react';
import { Tournament } from '@/hooks/useLobbyData';
import useVirtualizedList from '@/hooks/useVirtualizedList';
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
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizedList<HTMLDivElement>({
    count: tournaments.length,
    parentRef,
    estimateSize: 280,
  });
  const isVirtualized = tournaments.length >= 20;

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
        <div
          ref={parentRef}
          data-testid="tournaments-list"
          className="h-96 overflow-auto"
        >
          {isVirtualized ? (
            <ul
              role="list"
              className="m-0 p-0 list-none"
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const t = tournaments[virtualRow.index];
                return (
                  <li
                    key={t.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="mb-4"
                  >
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
                );
              })}
            </ul>
          ) : (
            <ul role="list" className="m-0 p-0 list-none">
              {tournaments.map((t) => (
                <li key={t.id} className="mb-4">
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
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

