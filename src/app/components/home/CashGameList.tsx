'use client';

import { useRef } from 'react';
import { Table } from '@/hooks/useLobbyData';
import useVirtualizedList from '@/hooks/useVirtualizedList';
import LiveTableCard from './LiveTableCard';
import useRenderCount from '@/hooks/useRenderCount';
import { GameType } from '@/types/game-type';

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
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizedList<HTMLDivElement>({
    count: tables.length,
    parentRef,
    estimateSize: 280,
  });
  const isVirtualized = tables.length >= 20;
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
        <div
          ref={parentRef}
          data-testid="tables-list"
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
                const table = tables[virtualRow.index];
                return (
                  <li
                    key={table.id}
                    className="mb-4"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
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
                );
              })}
            </ul>
          ) : (
            <ul role="list" className="m-0 p-0 list-none">
              {tables.map((table) => (
                <li key={table.id} className="mb-4">
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
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
