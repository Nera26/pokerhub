'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface TableUiContextValue {
  pendingBySeat: Record<number, number>;
  activeSeatId: number | null;
  setActiveSeat: (id: number | null) => void;
}

const TableUiContext = createContext<TableUiContextValue | undefined>(undefined);

export function TableUiProvider({ children }: { children: ReactNode }) {
  const [pendingBySeat] = useState<Record<number, number>>({});
  const [activeSeatId, setActiveSeatId] = useState<number | null>(null);

  const setActiveSeat = useCallback((id: number | null) => {
    setActiveSeatId(id);
  }, []);

  const value = useMemo(
    () => ({ pendingBySeat, activeSeatId, setActiveSeat }),
    [pendingBySeat, activeSeatId, setActiveSeat],
  );

  return (
    <TableUiContext.Provider value={value}>{children}</TableUiContext.Provider>
  );
}

export function useTableUi() {
  const ctx = useContext(TableUiContext);
  if (!ctx) {
    throw new Error('useTableUi must be used within a TableUiProvider');
  }
  return ctx;
}
