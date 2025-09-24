'use client';

import { useMemo } from 'react';
import {
  useTransactionHistoryControls,
  type UseTransactionHistoryControlsOptions,
  type UseTransactionHistoryControlsResult,
} from './TransactionHistoryControls';
import {
  useTransactionFilterQueries,
  type TransactionFilterQueries,
  type TransactionFilterMetadata,
} from '@/hooks/useTransactionFilterQueries';

export interface UseTransactionHistoryExperienceOptions<
  TEntry,
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> {
  locale: string;
  includePlayers: TIncludePlayers;
  includeTypes: TIncludeTypes;
  filtersEnabled?: boolean;
  history: UseTransactionHistoryControlsOptions<
    TEntry,
    TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
  >['history'];
  onExport?: UseTransactionHistoryControlsOptions<
    TEntry,
    TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
  >['onExport'];
}

export interface UseTransactionHistoryExperienceResult<
  TEntry,
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> {
  history: UseTransactionHistoryControlsResult<
    TEntry,
    TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
  >['history'];
  queries: UseTransactionHistoryControlsResult<
    TEntry,
    TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
  >['queries'];
  metadata: TransactionFilterMetadata<TIncludePlayers, TIncludeTypes>;
  handleExport: UseTransactionHistoryControlsResult<
    TEntry,
    TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
  >['handleExport'];
}

export default function useTransactionHistoryExperience<
  TEntry,
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
>({
  locale,
  includePlayers,
  includeTypes,
  filtersEnabled,
  history: historyOptions,
  onExport,
}: UseTransactionHistoryExperienceOptions<
  TEntry,
  TIncludePlayers,
  TIncludeTypes
>): UseTransactionHistoryExperienceResult<
  TEntry,
  TIncludePlayers,
  TIncludeTypes
> {
  const { queries: filterQueries, resolveMetadata } =
    useTransactionFilterQueries({
      locale,
      includePlayers,
      includeTypes,
      filtersEnabled,
    });

  const { history, queries, handleExport } = useTransactionHistoryControls<
    TEntry,
    TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
  >({
    history: historyOptions,
    queries: filterQueries,
    onExport,
  });

  const metadata = useMemo(
    () => resolveMetadata(queries),
    [queries, resolveMetadata],
  );

  return {
    history,
    queries,
    metadata,
    handleExport,
  };
}
