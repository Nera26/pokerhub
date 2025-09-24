import { useCallback, useMemo } from 'react';
import { fetchAdminPlayers } from '@/lib/api/wallet';
import {
  fetchTransactionFilters,
  fetchTransactionTypes,
} from '@/lib/api/transactions';
import type { FilterOptions } from '@shared/transactions.schema';
import { useTranslations } from '@/hooks/useTranslations';
import {
  type TransactionHistoryFilterQuery,
  type TransactionHistoryQueryResultMap,
} from '@/app/components/common/TransactionHistoryControls';
import {
  buildSelectOptions,
  type SelectOption,
} from '@/app/components/common/TransactionHistoryFilters';

type PlayersQuery = TransactionHistoryFilterQuery<
  'players',
  Awaited<ReturnType<typeof fetchAdminPlayers>>
>;

type TypesQuery = TransactionHistoryFilterQuery<
  'types',
  Awaited<ReturnType<typeof fetchTransactionTypes>>
>;

type FiltersQuery = TransactionHistoryFilterQuery<'filters', FilterOptions>;

export type TransactionFilterQueries<
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> = [
  ...(TIncludePlayers extends true ? [PlayersQuery] : []),
  ...(TIncludeTypes extends true ? [TypesQuery] : []),
  FiltersQuery,
];

export interface TransactionFilterSelectConfig {
  placeholderOption: SelectOption;
  options: SelectOption[];
}

export interface TransactionFilterMetadata<
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> {
  filterOptions: FilterOptions;
  typeSelect: TransactionFilterSelectConfig;
  performedBySelect: TransactionFilterSelectConfig;
  playerSelect: TIncludePlayers extends true
    ? TransactionFilterSelectConfig
    : undefined;
  players: TIncludePlayers extends true
    ? Awaited<ReturnType<typeof fetchAdminPlayers>>
    : undefined;
  types: TIncludeTypes extends true
    ? Awaited<ReturnType<typeof fetchTransactionTypes>>
    : undefined;
}

export interface UseTransactionFilterQueriesOptions<
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> {
  locale: string;
  includePlayers: TIncludePlayers;
  includeTypes: TIncludeTypes;
  filtersEnabled?: boolean;
}

export interface UseTransactionFilterQueriesResult<
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
> {
  queries: TransactionFilterQueries<TIncludePlayers, TIncludeTypes>;
  resolveMetadata: (
    results: TransactionHistoryQueryResultMap<
      TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
    >,
  ) => TransactionFilterMetadata<TIncludePlayers, TIncludeTypes>;
}

const emptyFilterOptions: FilterOptions = {
  types: [],
  performedBy: [],
};

export function useTransactionFilterQueries<
  TIncludePlayers extends boolean,
  TIncludeTypes extends boolean,
>({
  locale,
  includePlayers,
  includeTypes,
  filtersEnabled = true,
}: UseTransactionFilterQueriesOptions<
  TIncludePlayers,
  TIncludeTypes
>): UseTransactionFilterQueriesResult<TIncludePlayers, TIncludeTypes> {
  const { data: translationMessages } = useTranslations(locale);
  const translations = translationMessages ?? {};

  const queries = useMemo(() => {
    const configs: TransactionHistoryFilterQuery<string, unknown, unknown>[] =
      [];

    if (includePlayers) {
      configs.push({
        key: 'players',
        queryKey: ['adminPlayers'] as const,
        queryFn: fetchAdminPlayers,
        initialData: [] as Awaited<ReturnType<typeof fetchAdminPlayers>>,
      } satisfies PlayersQuery);
    }

    if (includeTypes) {
      configs.push({
        key: 'types',
        queryKey: ['transactionTypes'] as const,
        queryFn: fetchTransactionTypes,
        initialData: [] as Awaited<ReturnType<typeof fetchTransactionTypes>>,
      } satisfies TypesQuery);
    }

    configs.push({
      key: 'filters',
      queryKey: ['transactionFilters', locale] as const,
      queryFn: () => fetchTransactionFilters(locale),
      enabled: filtersEnabled,
      initialData: emptyFilterOptions,
    } satisfies FiltersQuery);

    return configs as TransactionFilterQueries<TIncludePlayers, TIncludeTypes>;
  }, [filtersEnabled, includePlayers, includeTypes, locale]);

  const resolveMetadata = useCallback(
    (
      results: TransactionHistoryQueryResultMap<
        TransactionFilterQueries<TIncludePlayers, TIncludeTypes>
      >,
    ) => {
      const players = (
        includePlayers ? (results.players?.data ?? []) : undefined
      ) as TransactionFilterMetadata<TIncludePlayers, TIncludeTypes>['players'];
      const types = (
        includeTypes ? (results.types?.data ?? []) : undefined
      ) as TransactionFilterMetadata<TIncludePlayers, TIncludeTypes>['types'];

      const filterOptions = (results.filters?.data ??
        emptyFilterOptions) as FilterOptions;

      const playerPlaceholderLabel =
        translations['transactions.filters.allPlayers'] ?? 'All Players';
      const typePlaceholderLabel =
        filterOptions.typePlaceholder ??
        translations['transactions.filters.allTypes'] ??
        'All Types';
      const performedByPlaceholderLabel =
        filterOptions.performedByPlaceholder ??
        translations['transactions.filters.performedByAll'] ??
        'Performed By: All';

      const playerSelect = includePlayers
        ? {
            placeholderOption: { value: '', label: playerPlaceholderLabel },
            options: buildSelectOptions({
              data: players,
              getValue: (player) => String(player?.id ?? ''),
              getLabel: (player) => String(player?.username ?? ''),
            }),
          }
        : undefined;

      const typeSelect = includeTypes
        ? {
            placeholderOption: { value: '', label: typePlaceholderLabel },
            options: buildSelectOptions({
              data: types,
              getValue: (type) => String(type?.id ?? ''),
              getLabel: (type) => String(type?.label ?? ''),
            }),
          }
        : {
            placeholderOption: {
              value: typePlaceholderLabel,
              label: typePlaceholderLabel,
            },
            options: buildSelectOptions({
              data: filterOptions?.types ?? [],
              getValue: (value) => value,
              getLabel: (value) => value,
              filter: (value) => value !== typePlaceholderLabel,
            }),
          };

      const performedBySelect: TransactionFilterSelectConfig = {
        placeholderOption: {
          value: performedByPlaceholderLabel,
          label: performedByPlaceholderLabel,
        },
        options: buildSelectOptions({
          data: filterOptions?.performedBy ?? [],
          getValue: (value) => value,
          getLabel: (value) => value,
          filter: (value) => value !== performedByPlaceholderLabel,
        }),
      };

      return {
        filterOptions,
        typeSelect,
        performedBySelect,
        playerSelect: playerSelect as TransactionFilterMetadata<
          TIncludePlayers,
          TIncludeTypes
        >['playerSelect'],
        players,
        types,
      } satisfies TransactionFilterMetadata<TIncludePlayers, TIncludeTypes>;
    },
    [includePlayers, includeTypes, translations],
  );

  return {
    queries,
    resolveMetadata,
  };
}

export default useTransactionFilterQueries;
