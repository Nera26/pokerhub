import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exportCsv } from '@/lib/exportCsv';

type Filters = Record<string, string>;

type FetchArgs = {
  signal?: AbortSignal;
  page: number;
  pageSize: number;
  filters: Filters;
};

export interface UseTransactionHistoryOptions<TEntry> {
  queryKey: unknown[];
  fetchTransactions: (args: FetchArgs) => Promise<TEntry[]>;
  initialFilters?: Filters;
  pageSize?: number;
  manualFilters?: boolean;
  paginated?: boolean;
  enabled?: boolean;
  clientFilter?: (entries: TEntry[], filters: Filters) => TEntry[];
  onFiltersApplied?: (entries: TEntry[]) => void;
  extractCurrency?: (entry: TEntry) => string | undefined;
  exportConfig?: {
    headers?: string[];
    mapRow?: (entry: TEntry, currency: string) => (string | number)[];
    filename?: (currency: string) => string;
  };
}

function defaultCurrency(entry: unknown): string | undefined {
  if (entry && typeof entry === 'object' && 'currency' in entry) {
    const value = (entry as { currency?: string }).currency;
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

function normalizeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  if (!str) return '';
  if (/[",\n]/.test(str)) {
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return str;
}

function defaultMapRow(entry: Record<string, unknown>, currency: string) {
  const rawAmount = entry.amount;
  const amountValue =
    typeof rawAmount === 'number' || typeof rawAmount === 'bigint'
      ? String(rawAmount)
      : String(rawAmount ?? '');
  const amount = currency ? `${currency} ${amountValue}`.trim() : amountValue;

  const datetime =
    (entry.datetime as string | undefined) ??
    (entry.date as string | undefined) ??
    '';
  const action =
    (entry.action as string | undefined) ??
    (entry.type as string | undefined) ??
    '';
  const performedBy =
    (entry.by as string | undefined) ??
    (entry.performedBy as string | undefined) ??
    '';

  return [
    datetime,
    action,
    amount,
    performedBy,
    entry.notes ?? '',
    entry.status ?? '',
  ];
}

const defaultHeaders = [
  'Date/Time',
  'Action',
  'Amount',
  'By',
  'Notes',
  'Status',
];

export interface UseTransactionHistoryReturn<TEntry> {
  data: TEntry[];
  rawData: TEntry[];
  isLoading: boolean;
  error: unknown;
  currency: string;
  filters: Filters;
  appliedFilters: Filters;
  updateFilter: (key: string, value: string) => void;
  replaceFilters: (next: Filters) => void;
  syncFilters: (next: Filters) => void;
  applyFilters: (options?: { silent?: boolean }) => void;
  page: number;
  setPage: (next: number) => void;
  pageSize: number;
  hasMore: boolean;
  exportToCsv: () => void;
}

export function useTransactionHistory<TEntry>(
  options: UseTransactionHistoryOptions<TEntry>,
): UseTransactionHistoryReturn<TEntry> {
  const {
    queryKey,
    fetchTransactions,
    initialFilters = {},
    pageSize: providedPageSize = 10,
    manualFilters = false,
    paginated = true,
    enabled = true,
    clientFilter,
    onFiltersApplied,
    extractCurrency = defaultCurrency,
    exportConfig,
  } = options;

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);
  const [page, setPageState] = useState(1);

  const pageSize = paginated ? providedPageSize : (providedPageSize ?? 10);

  const effectiveFilters = manualFilters ? appliedFilters : filters;

  const {
    data: rawData = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      ...queryKey,
      effectiveFilters,
      paginated ? page : undefined,
      paginated ? pageSize : undefined,
    ],
    queryFn: ({ signal }) =>
      fetchTransactions({ signal, page, pageSize, filters: effectiveFilters }),
    enabled,
    keepPreviousData: paginated,
  });

  const processedData = useMemo(() => {
    if (!clientFilter) return rawData;
    return clientFilter(rawData, effectiveFilters);
  }, [clientFilter, rawData, effectiveFilters]);

  const currency = useMemo(() => {
    const sample = processedData[0] ?? rawData[0];
    return extractCurrency(sample) ?? 'USD';
  }, [processedData, rawData, extractCurrency]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (!manualFilters) {
          setPageState(1);
        }
        return next;
      });
    },
    [manualFilters],
  );

  const replaceFilters = useCallback(
    (next: Filters) => {
      setFilters(next);
      if (!manualFilters) {
        setPageState(1);
      }
    },
    [manualFilters],
  );

  const syncFilters = useCallback((next: Filters) => {
    setFilters(next);
    setAppliedFilters(next);
    setPageState(1);
  }, []);

  const applyFilters = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!manualFilters) return;
      const next = { ...filters };
      setAppliedFilters(next);
      setPageState(1);
      if (!opts?.silent) {
        const target = clientFilter ? clientFilter(rawData, next) : rawData;
        onFiltersApplied?.(target);
      }
    },
    [clientFilter, filters, manualFilters, onFiltersApplied, rawData],
  );

  const setPage = useCallback((next: number) => {
    setPageState((prev) => {
      const value = Math.max(1, next);
      if (value === prev) return prev;
      return value;
    });
  }, []);

  const hasMore = useMemo(() => {
    if (!paginated) return false;
    return rawData.length === pageSize;
  }, [paginated, rawData.length, pageSize]);

  const exportToCsv = useCallback(() => {
    const headers = exportConfig?.headers ?? defaultHeaders;
    const mapRow =
      exportConfig?.mapRow ??
      ((entry: TEntry, money: string) =>
        defaultMapRow(entry as Record<string, unknown>, money));
    const filename =
      exportConfig?.filename?.(currency) ??
      `transactions_${new Date().toISOString().split('T')[0]}.csv`;

    const rows = processedData.map((entry) => {
      const cells = mapRow(entry, currency);
      return cells.map(normalizeCsvCell);
    });
    exportCsv(filename, headers, rows);
  }, [currency, exportConfig, processedData]);

  return {
    data: processedData,
    rawData,
    isLoading,
    error,
    currency,
    filters,
    appliedFilters,
    updateFilter,
    replaceFilters,
    syncFilters,
    applyFilters,
    page,
    setPage,
    pageSize,
    hasMore,
    exportToCsv,
  };
}

export default useTransactionHistory;
