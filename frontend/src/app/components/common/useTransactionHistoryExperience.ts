import { useMemo } from 'react';
import useTransactionHistoryControls, {
  type UseTransactionHistoryControlsResult,
} from './TransactionHistoryControls';
import type { UseTransactionHistoryOptions } from './useTransactionHistory';
import useTransactionFilterQueries, {
  type TransactionFilterMetadata,
  type TransactionFilterQueries,
  type UseTransactionFilterQueriesOptions,
} from '@/hooks/useTransactionFilterQueries';

export interface UseTransactionHistoryExperienceOptions<
  TEntry,
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> extends UseTransactionFilterQueriesOptions<TIncludePlayers, TIncludeTypes> {
  history: UseTransactionHistoryOptions<TEntry>;
  onExport?: () => void;
}

export type UseTransactionHistoryExperienceResult<
  TEntry,
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> = UseTransactionHistoryControlsResult<
  TEntry,
  TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
> & {
  filterMetadata: TransactionFilterMetadata<TIncludePlayers, TIncludeTypes>;
};

export function useTransactionHistoryExperience<
  TEntry,
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
>({
  history: historyOptions,
  onExport,
  ...filterOptions
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
    useTransactionFilterQueries<TIncludePlayers, TIncludeTypes>(filterOptions);

  const controls = useTransactionHistoryControls<
    TEntry,
    TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
  >({
    history: historyOptions,
    queries: filterQueries,
    onExport,
  });

  const filterMetadata = useMemo(
    () => resolveMetadata(controls.queries),
    [controls.queries, resolveMetadata],
  );

  return {
    ...controls,
    filterMetadata,
  };
}

export default useTransactionHistoryExperience;
