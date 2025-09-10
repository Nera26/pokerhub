'use client';

import { Table } from '@/hooks/useLobbyData';
import LiveTableCard from './LiveTableCard';
import type { GameType } from '@shared/types';
import EntityList from '@/components/EntityList';

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
  return (
    <EntityList<Table>
      id="cash-games-panel"
      aria-labelledby={`tab-${gameType === 'tournaments' ? 'texas' : gameType}`}
      hidden={hidden}
      title="Cash Games"
      containerClassName="mb-6 md:mb-8"
      emptyMessage="No cash games available."
      items={tables}
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
            spectateHref={`/table/${table.id}/spectate`}
          />
        </li>
      )}
    />
  );
}
