'use client';

import { useMemo } from 'react';
import {
  useTransactionFilterQueries,
  type UseTransactionFilterQueriesOptions,
  type TransactionFilterMetadata,
  type TransactionFilterQueries,
} from '@/hooks/useTransactionFilterQueries';
import useTransactionHistoryControls, {
  type TransactionHistoryQueryResultMap,
} from './TransactionHistoryControls';
import type {
  UseTransactionHistoryOptions,
  UseTransactionHistoryReturn,
} from './useTransactionHistory';

export interface UseTransactionHistoryExperienceOptions<
  TEntry,
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> {
  history: UseTransactionHistoryOptions<TEntry>;
  filterQueries: UseTransactionFilterQueriesOptions<
    TIncludePlayers,
    TIncludeTypes
  >;
  onExport?: () => void;
}

export interface TransactionHistoryExperienceResult<
  TEntry,
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> {
  history: UseTransactionHistoryReturn<TEntry>;
  queries: TransactionHistoryQueryResultMap<
    TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
  >;
  metadata: TransactionFilterMetadata<TIncludePlayers, TIncludeTypes>;
  handleExport: () => void;
}

export function useTransactionHistoryExperience<
  TEntry,
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
>({
  history,
  filterQueries,
  onExport,
}: UseTransactionHistoryExperienceOptions<
  TEntry,
  TIncludePlayers,
  TIncludeTypes
>): TransactionHistoryExperienceResult<TEntry, TIncludePlayers, TIncludeTypes> {
  const filterQueryResult = useTransactionFilterQueries(filterQueries);
  const controls = useTransactionHistoryControls<
    TEntry,
    TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
  >({
    history,
    queries: filterQueryResult.queries,
    onExport,
  });

  const metadata = useMemo(
    () => filterQueryResult.resolveMetadata(controls.queries),
    [filterQueryResult, controls.queries],
  );

  return {
    history: controls.history,
    queries: controls.queries,
    metadata,
    handleExport: controls.handleExport,
  };
}

export default useTransactionHistoryExperience;
