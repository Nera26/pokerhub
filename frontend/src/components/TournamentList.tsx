'use client';

import { ReactNode } from 'react';
import { Tournament } from '@/hooks/useLobbyData';
import TournamentItem from './TournamentItem';
import VirtualizedList from './VirtualizedList';

export interface TournamentListProps<T extends Tournament> {
  tournaments: T[];
  hidden: boolean;
  renderActions?: (t: T) => ReactNode;
  renderExtras?: (t: T) => ReactNode;
}

export default function TournamentList<T extends Tournament>({
  tournaments,
  hidden,
  renderActions,
  renderExtras,
}: TournamentListProps<T>) {
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
          testId="tournaments-list"
          className="h-96 overflow-auto"
          renderItem={(t, style) => (
            <TournamentItem
              key={t.id}
              tournament={t}
              renderActions={renderActions}
              renderExtras={renderExtras}
              style={style}
            />
          )}
        />
      )}
    </section>
  );
}

