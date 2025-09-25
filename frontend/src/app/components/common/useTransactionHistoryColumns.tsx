import { useMemo } from 'react';
import type { Column } from './TransactionHistoryTable';
import { getTransactionTimestamp } from './TransactionHistoryTable';
import { AmountCell, StatusCell } from './transactionCells';

export interface TransactionHistoryColumnMeta {
  id: string;
  label: string;
}

type FallbackGetter<T> = (row: T) => unknown;

type ColumnOverride<T> = Pick<
  Column<T>,
  'cell' | 'cellClassName' | 'headerClassName'
>;

export interface UseTransactionHistoryColumnsOptions<T> {
  currency?: string;
  headerClassName?: string;
  cellClassName?: string;
  overrides?: Partial<Record<string, ColumnOverride<T>>>;
  fallbackGetters?: Partial<Record<string, FallbackGetter<T>>>;
}

const defaultHeaderClassName =
  'text-left p-4 font-semibold text-text-secondary text-sm uppercase';
const defaultCellClassName = 'p-4 text-sm';

const defaultFallbacks: Record<
  string,
  FallbackGetter<Record<string, unknown>>
> = {
  type: (row) =>
    (row as { type?: unknown; action?: unknown }).type ??
    (row as { action?: unknown }).action,
  action: (row) =>
    (row as { action?: unknown; type?: unknown }).action ??
    (row as { type?: unknown }).type,
  by: (row) =>
    (row as { by?: unknown; performedBy?: unknown }).by ??
    (row as { performedBy?: unknown }).performedBy,
  performedBy: (row) =>
    (row as { performedBy?: unknown; by?: unknown }).performedBy ??
    (row as { by?: unknown }).by,
};

export default function useTransactionHistoryColumns<
  T extends Record<string, unknown>,
>(
  meta: TransactionHistoryColumnMeta[],
  {
    currency,
    headerClassName = defaultHeaderClassName,
    cellClassName = defaultCellClassName,
    overrides = {},
    fallbackGetters = {},
  }: UseTransactionHistoryColumnsOptions<T> = {},
): Column<T>[] {
  const mergedFallbacks = useMemo(
    () => ({ ...defaultFallbacks, ...fallbackGetters }),
    [fallbackGetters],
  );

  return useMemo(
    () =>
      meta.map((columnMeta) => {
        const override = overrides[columnMeta.id] ?? {};
        const baseHeaderClassName = override.headerClassName ?? headerClassName;
        const baseCellClassName = override.cellClassName ?? cellClassName;

        const cellRenderer =
          override.cell ??
          ((row: T) => {
            switch (columnMeta.id) {
              case 'amount':
                return (
                  <AmountCell
                    amount={Number((row as { amount?: number }).amount ?? 0)}
                    currency={currency}
                  />
                );
              case 'status':
                return (
                  <StatusCell
                    status={String((row as { status?: string }).status ?? '')}
                  />
                );
              case 'date':
              case 'datetime':
                return getTransactionTimestamp(
                  row as unknown as {
                    date?: string | null;
                    datetime?: string | null;
                  },
                );
              default: {
                const getter = mergedFallbacks[columnMeta.id];
                if (getter) {
                  const value = getter(row);
                  return value ?? '';
                }
                return (row as Record<string, unknown>)[columnMeta.id] ?? '';
              }
            }
          });

        return {
          header: columnMeta.label,
          headerClassName: baseHeaderClassName,
          cellClassName: baseCellClassName,
          cell: cellRenderer,
        };
      }),
    [
      meta,
      overrides,
      headerClassName,
      cellClassName,
      currency,
      mergedFallbacks,
    ],
  );
}
