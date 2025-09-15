'use client';

import { useTableTheme } from '@/hooks/useTableTheme';
import type { TableThemeResponse } from '@shared/types';

export function useTableThemeData() {
  const { data, isLoading, isError } = useTableTheme();

  if (isLoading) {
    return {
      status: 'loading' as const,
      positions: undefined as undefined | TableThemeResponse['positions'],
    };
  }
  if (isError || !data) {
    return {
      status: 'error' as const,
      positions: undefined as undefined | TableThemeResponse['positions'],
    };
  }
  return { status: 'success' as const, positions: data.positions };
}

export default useTableThemeData;
