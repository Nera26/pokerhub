'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import {
  useQueries,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import useTransactionHistory, {
  type UseTransactionHistoryOptions,
  type UseTransactionHistoryReturn,
} from './useTransactionHistory';

export interface TransactionHistoryFilterQuery<
  TKey extends string,
  TQueryFnData,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends UseQueryOptions<TQueryFnData, unknown, TData, TQueryKey> {
  key: TKey;
}

export type TransactionHistoryQueryResult<TData> = Pick<
  UseQueryResult<TData, unknown>,
  'error' | 'isLoading' | 'isFetching' | 'refetch'
> & {
  data: TData | undefined;
};

export type TransactionHistoryQueryKey<
  TQuery extends TransactionHistoryFilterQuery<any, any, any, any>,
> = TQuery['key'];

export type TransactionHistoryQueryData<
  TQuery extends TransactionHistoryFilterQuery<any, any, any, any>,
> =
  TQuery extends TransactionHistoryFilterQuery<any, any, infer TData, any>
    ? TData
    : never;

export type TransactionHistoryQueryResultMap<
  TQueries extends readonly TransactionHistoryFilterQuery<any, any, any, any>[],
> = {
  [K in TransactionHistoryQueryKey<
    TQueries[number]
  >]: TransactionHistoryQueryResult<
    TransactionHistoryQueryData<Extract<TQueries[number], { key: K }>>
  >;
};

export interface UseTransactionHistoryControlsOptions<
  TEntry,
  TQueries extends readonly TransactionHistoryFilterQuery<
    any,
    any,
    any,
    any
  >[] = [],
> {
  history: UseTransactionHistoryOptions<TEntry>;
  queries?: TQueries;
  onExport?: () => void;
}

export interface UseTransactionHistoryControlsResult<
  TEntry,
  TQueries extends readonly TransactionHistoryFilterQuery<
    any,
    any,
    any,
    any
  >[] = [],
> {
  history: UseTransactionHistoryReturn<TEntry>;
  queries: TransactionHistoryQueryResultMap<TQueries>;
  handleExport: () => void;
}

export function useTransactionHistoryControls<
  TEntry,
  TQueries extends readonly TransactionHistoryFilterQuery<
    any,
    any,
    any,
    any
  >[] = [],
>({
  history: historyOptions,
  queries: queryConfigsArg,
  onExport,
}: UseTransactionHistoryControlsOptions<
  TEntry,
  TQueries
>): UseTransactionHistoryControlsResult<TEntry, TQueries> {
  const history = useTransactionHistory(historyOptions);

  const queryConfigs = useMemo(
    () => (queryConfigsArg ?? []) as TQueries,
    [queryConfigsArg],
  );

  const queryResults = useQueries({
    queries: queryConfigs.map(({ key: _key, ...config }) => config),
  }) as {
    [Index in keyof TQueries]: UseQueryResult<
      TQueries[Index] extends TransactionHistoryFilterQuery<
        any,
        any,
        infer TData,
        any
      >
        ? TData
        : never,
      unknown
    >;
  };

  const queries = useMemo(() => {
    return queryConfigs.reduce((acc, config, index) => {
      const result = queryResults[index];
      const fallbackData =
        typeof config.initialData === 'function'
          ? config.initialData()
          : config.initialData;

      (acc as Record<string, TransactionHistoryQueryResult<unknown>>)[
        config.key
      ] = {
        data: (result.data ?? (fallbackData as unknown)) as unknown,
        error: result.error,
        isLoading: result.isLoading,
        isFetching: result.isFetching,
        refetch: result.refetch,
      };
      return acc;
    }, {} as TransactionHistoryQueryResultMap<TQueries>);
  }, [queryConfigs, queryResults]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
      return;
    }

    history.exportToCsv();
  }, [history.exportToCsv, onExport]);

  return {
    history,
    queries,
    handleExport,
  };
}

export interface TransactionHistoryControlsProps<
  TEntry,
  TQueries extends readonly TransactionHistoryFilterQuery<
    any,
    any,
    any,
    any
  >[] = [],
> extends UseTransactionHistoryControlsOptions<TEntry, TQueries> {
  children: (
    value: UseTransactionHistoryControlsResult<TEntry, TQueries>,
  ) => ReactNode;
}

export function TransactionHistoryControls<
  TEntry,
  TQueries extends readonly TransactionHistoryFilterQuery<
    any,
    any,
    any,
    any
  >[] = [],
>({ children, ...options }: TransactionHistoryControlsProps<TEntry, TQueries>) {
  const value = useTransactionHistoryControls<TEntry, TQueries>(options);
  return <>{children(value)}</>;
}

export default useTransactionHistoryControls;
