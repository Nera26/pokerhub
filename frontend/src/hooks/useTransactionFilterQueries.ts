import { useMemo } from 'react';
import type { TransactionHistoryFilterQuery } from '@/app/components/common/TransactionHistoryControls';
import type { SelectOption } from '@/app/components/common/TransactionHistoryFilters';
import { fetchAdminPlayers } from '@/lib/api/wallet';
import {
  fetchTransactionFilters,
  fetchTransactionTypes,
} from '@/lib/api/transactions';
import type { FilterOptions } from '@shared/transactions.schema';

type PlayersQuery = TransactionHistoryFilterQuery<
  'players',
  Awaited<ReturnType<typeof fetchAdminPlayers>>,
  Awaited<ReturnType<typeof fetchAdminPlayers>>,
  readonly ['adminPlayers']
>;

type TypesQuery = TransactionHistoryFilterQuery<
  'types',
  Awaited<ReturnType<typeof fetchTransactionTypes>>,
  Awaited<ReturnType<typeof fetchTransactionTypes>>,
  readonly ['transactionTypes']
>;

type FiltersQuery = TransactionHistoryFilterQuery<
  'filters',
  FilterOptions,
  FilterOptions,
  readonly ['transactionFilters', string]
>;

type TransactionFilterQueries<
  IncludePlayers extends boolean,
  IncludeTypes extends boolean,
> = IncludePlayers extends true
  ? IncludeTypes extends true
    ? readonly [PlayersQuery, TypesQuery, FiltersQuery]
    : readonly [PlayersQuery, FiltersQuery]
  : IncludeTypes extends true
    ? readonly [TypesQuery, FiltersQuery]
    : readonly [FiltersQuery];

interface UseTransactionFilterQueriesOptions<
  IncludePlayers extends boolean,
  IncludeTypes extends boolean,
> {
  locale: string;
  includePlayers?: IncludePlayers;
  includeTypes?: IncludeTypes;
  filtersEnabled?: boolean;
}

export function useTransactionFilterQueries<
  IncludePlayers extends boolean = false,
  IncludeTypes extends boolean = false,
>({
  locale,
  includePlayers,
  includeTypes,
  filtersEnabled = true,
}: UseTransactionFilterQueriesOptions<
  IncludePlayers,
  IncludeTypes
>): TransactionFilterQueries<IncludePlayers, IncludeTypes> {
  return useMemo(() => {
    const playersQuery: PlayersQuery = {
      key: 'players',
      queryKey: ['adminPlayers'] as const,
      queryFn: fetchAdminPlayers,
      initialData: [] as Awaited<ReturnType<typeof fetchAdminPlayers>>,
    };

    const typesQuery: TypesQuery = {
      key: 'types',
      queryKey: ['transactionTypes'] as const,
      queryFn: fetchTransactionTypes,
      initialData: [] as Awaited<ReturnType<typeof fetchTransactionTypes>>,
    };

    const filtersQuery: FiltersQuery = {
      key: 'filters',
      queryKey: ['transactionFilters', locale] as const,
      queryFn: () => fetchTransactionFilters(locale),
      enabled: filtersEnabled,
      initialData: {
        types: [],
        performedBy: [],
      } as FilterOptions,
    };

    if (includePlayers && includeTypes) {
      return [
        playersQuery,
        typesQuery,
        filtersQuery,
      ] as unknown as TransactionFilterQueries<IncludePlayers, IncludeTypes>;
    }

    if (includePlayers) {
      return [
        playersQuery,
        filtersQuery,
      ] as unknown as TransactionFilterQueries<IncludePlayers, IncludeTypes>;
    }

    if (includeTypes) {
      return [typesQuery, filtersQuery] as unknown as TransactionFilterQueries<
        IncludePlayers,
        IncludeTypes
      >;
    }

    return [filtersQuery] as unknown as TransactionFilterQueries<
      IncludePlayers,
      IncludeTypes
    >;
  }, [filtersEnabled, includePlayers, includeTypes, locale]);
}

type FilterPlaceholderKey = Extract<
  keyof FilterOptions,
  'typePlaceholder' | 'performedByPlaceholder'
>;

interface ResolvePlaceholderLabelOptions {
  filterOptions?: FilterOptions | null;
  placeholderKey?: FilterPlaceholderKey;
  translations?: Partial<Record<string, string>> | null;
  translationKey?: string;
  fallback: string;
}

export function resolveTransactionFilterLabel({
  filterOptions,
  placeholderKey,
  translations,
  translationKey,
  fallback,
}: ResolvePlaceholderLabelOptions): string {
  if (placeholderKey && filterOptions?.[placeholderKey]) {
    return filterOptions[placeholderKey] as string;
  }

  if (translationKey && translations?.[translationKey]) {
    return translations[translationKey] as string;
  }

  return fallback;
}

interface CreatePlaceholderOptionOptions {
  value?: string;
  disabled?: boolean;
}

export function createPlaceholderOption(
  label: string,
  { value = '', disabled }: CreatePlaceholderOptionOptions = {},
): SelectOption {
  return {
    value,
    label,
    disabled,
  };
}
