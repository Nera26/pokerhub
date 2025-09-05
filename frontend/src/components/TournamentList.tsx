'use client';

import { useRef, ReactNode } from 'react';
import { Tournament } from '@/hooks/useLobbyData';
import useVirtualizedList from '@/hooks/useVirtualizedList';
import TournamentItem from './TournamentItem';

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
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizedList<HTMLDivElement>({
    count: tournaments.length,
    parentRef,
    estimateSize: 280,
  });
  const isVirtualized = tournaments.length >= 20;

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
                  <TournamentItem
                    key={t.id}
                    tournament={t}
                    renderActions={renderActions}
                    renderExtras={renderExtras}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                );
              })}
            </ul>
          ) : (
            <ul role="list" className="m-0 p-0 list-none">
              {tournaments.map((t) => (
                <TournamentItem
                  key={t.id}
                  tournament={t}
                  renderActions={renderActions}
                  renderExtras={renderExtras}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

