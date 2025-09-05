'use client';

import { Table } from '@/hooks/useLobbyData';
import LiveTableCard from './LiveTableCard';
import useRenderCount from '@/hooks/useRenderCount';
import { GameType } from '@/types/game-type';
import VirtualizedList from '@/components/VirtualizedList';

export interface CashGameListProps {
  tables: Table[];
  gameType: GameType;
  hidden: boolean;
}

export default function CashGameList({
  tables,
  gameType,
  hidden,
}: CashGameListProps) {
  useRenderCount('CashGameList');

  return (
    <section
      id="cash-games-panel"
      role="tabpanel"
      aria-labelledby={`tab-${gameType === 'tournaments' ? 'texas' : gameType}`}
      hidden={hidden}
      className="mb-6 md:mb-8"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
        Cash Games
      </h2>
      {tables.length === 0 ? (
        <p>No tables available.</p>
      ) : (
        <VirtualizedList
          items={tables}
          testId="tables-list"
          className="h-96 overflow-auto"
          renderItem={(table, style) => (
            <li key={table.id} className="mb-4" style={style}>
              <LiveTableCard
                tableName={table.tableName}
                stakes={table.stakes}
                players={table.players}
                buyIn={table.buyIn}
                stats={table.stats}
                createdAgo={table.createdAgo}
                href={`/table/${table.id}`}
              />
            </li>
          )}
        />
      )}
    </section>
  );
}
