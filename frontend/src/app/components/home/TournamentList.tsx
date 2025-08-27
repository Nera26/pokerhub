'use client';

import { useRef } from 'react';
import { Tournament } from '@/hooks/useLobbyData';
import useVirtualizedList from '@/hooks/useVirtualizedList';
import Button from '../ui/Button';
import useRenderCount from '@/hooks/useRenderCount';

export interface TournamentListProps {
  tournaments: Tournament[];
  hidden: boolean;
}

export default function TournamentList({
  tournaments,
  hidden,
}: TournamentListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizedList<HTMLDivElement>({
    count: tournaments.length,
    parentRef,
    estimateSize: 280,
  });
  const isVirtualized = tournaments.length >= 20;
  useRenderCount('TournamentList');

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
                    className="mb-4 bg-card-bg rounded-2xl p-[20px] flex flex-col justify-between hover:bg-hover-bg transition-colors duration-200"
                  >
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">
                        {t.title}
                      </h3>
                      <p className="text-text-secondary text-sm mb-4">
                        Buy-in: ${t.buyIn}
                        {t.fee ? ` + $${t.fee} fee` : ''}
                      </p>
                      <p className="text-text-secondary text-sm mb-4">
                        Prize Pool: {t.prizePool}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-text-secondary text-sm">
                        {t.players.current}/{t.players.max} players
                      </p>
                      {t.registered ? (
                        <Button variant="outline" size="sm">
                          Registered
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm">
                          Register
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul role="list" className="m-0 p-0 list-none">
              {tournaments.map((t) => (
                <li
                  key={t.id}
                  className="mb-4 bg-card-bg rounded-2xl p-[20px] flex flex-col justify-between hover:bg-hover-bg transition-colors duration-200"
                >
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">
                      {t.title}
                    </h3>
                    <p className="text-text-secondary text-sm mb-4">
                      Buy-in: ${t.buyIn}
                      {t.fee ? ` + $${t.fee} fee` : ''}
                    </p>
                    <p className="text-text-secondary text-sm mb-4">
                      Prize Pool: {t.prizePool}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-text-secondary text-sm">
                      {t.players.current}/{t.players.max} players
                    </p>
                    {t.registered ? (
                      <Button variant="outline" size="sm">
                        Registered
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm">
                        Register
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
