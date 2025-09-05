'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { Tournament } from '@/hooks/useLobbyData';

interface TournamentItemProps<T extends Tournament> {
  tournament: T;
  renderActions?: (t: T) => ReactNode;
  renderExtras?: (t: T) => ReactNode;
  style?: CSSProperties;
}

export default function TournamentItem<T extends Tournament>({
  tournament: t,
  renderActions,
  renderExtras,
  style,
}: TournamentItemProps<T>) {
  return (
    <li
      style={style}
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
        {renderExtras?.(t)}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">
          {t.players.current}/{t.players.max} players
        </p>
        {renderActions?.(t)}
      </div>
    </li>
  );
}

