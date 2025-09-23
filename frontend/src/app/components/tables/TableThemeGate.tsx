'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { TableThemeResponse } from '@shared/types';
import { useTableTheme } from '@/hooks/useTableTheme';

type TableThemePositions = TableThemeResponse['positions'];

const TableThemeContext = createContext<TableThemePositions | null>(null);

export function useTableThemePositions() {
  const positions = useContext(TableThemeContext);
  if (positions === null) {
    throw new Error(
      'useTableThemePositions must be used within a <TableThemeGate>',
    );
  }
  return positions;
}

interface TableThemeGateProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
}

export default function TableThemeGate({
  children,
  loadingFallback,
  errorFallback,
}: TableThemeGateProps) {
  const { status, positions } = useTableTheme();

  if (status === 'pending') {
    return <>{loadingFallback ?? <div>Loading table theme...</div>}</>;
  }

  if (status === 'error' || !positions) {
    return <>{errorFallback ?? <div>Failed to load theme</div>}</>;
  }

  return (
    <TableThemeContext.Provider value={positions}>
      {children}
    </TableThemeContext.Provider>
  );
}
