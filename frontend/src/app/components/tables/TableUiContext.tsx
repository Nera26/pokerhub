'use client';

import React from 'react';

export interface TableUiContextValue {
  pendingBySeat: Record<number, number>;
  activeSeatId: number | null;
  setActiveSeat: (id: number | null) => void;
}

const TableUiContext = React.createContext<TableUiContextValue | undefined>(
  undefined,
);

export function TableUiProvider({ children }: { children: React.ReactNode }) {
  const [pendingBySeat] = React.useState<Record<number, number>>({});
  const [activeSeatId, setActiveSeatId] = React.useState<number | null>(null);

  const setActiveSeat = React.useCallback((id: number | null) => {
    setActiveSeatId(id);
  }, []);

  const value = React.useMemo(
    () => ({ pendingBySeat, activeSeatId, setActiveSeat }),
    [pendingBySeat, activeSeatId, setActiveSeat],
  );

  return (
    <TableUiContext.Provider value={value}>{children}</TableUiContext.Provider>
  );
}

export function useTableUi() {
  const ctx = React.useContext(TableUiContext);
  if (!ctx) {
    throw new Error('useTableUi must be used within a TableUiProvider');
  }
  return ctx;
}
