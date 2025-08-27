'use client';

import { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/app/components/ui/ErrorBoundary';
import { useTables, type Table } from '@/hooks/useLobbyData';
import useVirtualizedList from '@/hooks/useVirtualizedList';

const LiveTableCard = dynamic(
  () => import('@/app/components/home/LiveTableCard'),
  {
    loading: () => (
      <div
        className="rounded-2xl bg-card-bg h-48 animate-pulse"
        aria-label="Loading table"
      />
    ),
  },
);

export default function TablePage() {
  const { data: tables = [], isLoading, error } = useTables();

  const rows = useMemo<Table[][]>(() => {
    const chunked: Table[][] = [];
    for (let i = 0; i < tables.length; i += 3) {
      chunked.push(tables.slice(i, i + 3));
    }
    return chunked;
  }, [tables]);

  const parentRef = useRef<HTMLDivElement>(null);
  const isVirtualized = tables.length >= 20;
  const virtualizer = isVirtualized
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useVirtualizedList<HTMLDivElement>({
        count: rows.length,
        parentRef,
        estimateSize: 280,
      })
    : null;

  return (
    <main
      id="main-content"
      className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)] bg-primary-bg text-text-primary"
    >
      <h1 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
        Live Tables
      </h1>

      {error && <p className="mb-4 text-danger-red">Failed to load tables.</p>}

      <div
        ref={parentRef}
        className={isVirtualized ? 'h-96 overflow-auto' : undefined}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card-bg h-48 animate-pulse"
                aria-label="Loading table"
              />
            ))}
          </div>
        ) : tables.length === 0 ? (
          <p>No tables available.</p>
        ) : isVirtualized ? (
          <div
            style={{
              height: `${virtualizer!.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {virtualizer!.getVirtualItems().map((virtualRow) => {
              const rowTables = rows[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4"
                >
                  {rowTables.map((table) => (
                    <ErrorBoundary
                      key={table.id}
                      fallback={
                        <div className="rounded-2xl bg-card-bg h-48 flex items-center justify-center">
                          Error loading table.
                        </div>
                      }
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
                    </ErrorBoundary>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tables.map((table) => (
              <ErrorBoundary
                key={table.id}
                fallback={
                  <div className="rounded-2xl bg-card-bg h-48 flex items-center justify-center">
                    Error loading table.
                  </div>
                }
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
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
