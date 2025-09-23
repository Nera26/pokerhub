'use client';

import { useEffect, useMemo, useRef } from 'react';
import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import TransactionHistoryTable, {
  type Column,
} from '@/app/components/common/TransactionHistoryTable';
import {
  AmountCell,
  StatusCell,
} from '@/app/components/common/transactionCells';
import {
  fetchTransactionFilters,
  fetchUserTransactions,
} from '@/lib/api/transactions';
import type { FilterOptions } from '@shared/transactions.schema';
import { AdminTransactionEntriesSchema } from '@shared/transactions.schema';
import { z } from 'zod';
import useTransactionColumns from '@/hooks/useTransactionColumns';
import {
  useTransactionHistoryControls,
  type TransactionHistoryFilterQuery,
} from '@/app/components/common/TransactionHistoryControls';
import TransactionHistoryFilters, {
  buildSelectOptions,
} from '@/app/components/common/TransactionHistoryFilters';

export type Transaction = {
  datetime: string;
  action: string;
  amount: number;
  by: string;
  notes: string;
  status: string;
};

type AdminTransactionEntry = z.infer<
  typeof AdminTransactionEntriesSchema
>[number];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userId: string;
  onFilter?: (filtered: AdminTransactionEntry[]) => void;
}

const commonOpts = {
  headerClassName: 'text-left py-3 px-2 text-text-secondary',
  cellClassName: 'py-3 px-2',
};

export default function TransactionHistoryModal({
  isOpen,
  onClose,
  userName,
  userId,
  onFilter,
}: Props) {
  const defaultTypeRef = useRef('');
  const defaultByRef = useRef('');

  const {
    data: colMeta = [],
    isLoading: colsLoading,
    error: colsError,
  } = useTransactionColumns();

  const filterQueries = useMemo(
    () =>
      [
        {
          key: 'filters',
          queryKey: ['transactionFilters'] as const,
          queryFn: fetchTransactionFilters,
          enabled: isOpen,
          initialData: { types: [], performedBy: [] } as FilterOptions,
        },
      ] as const satisfies readonly TransactionHistoryFilterQuery<
        'filters',
        FilterOptions,
        FilterOptions
      >[],
    [isOpen],
  );

  const { history, queries } = useTransactionHistoryControls<
    AdminTransactionEntry,
    typeof filterQueries
  >({
    history: {
      queryKey: ['userTransactions', userId],
      fetchTransactions: async () => fetchUserTransactions(userId),
      initialFilters: { start: '', end: '', type: '', by: '' },
      manualFilters: true,
      paginated: false,
      enabled: isOpen && !!userId,
      clientFilter: (allEntries, currentFilters) => {
        let data = [...allEntries];
        const appliedType = currentFilters.type;
        const appliedBy = currentFilters.by;
        const sentinelType = defaultTypeRef.current;
        const sentinelBy = defaultByRef.current;
        if (appliedType && sentinelType && appliedType !== sentinelType) {
          data = data.filter((entry) => entry.action === appliedType);
        }
        if (appliedBy && sentinelBy && appliedBy !== sentinelBy) {
          data = data.filter((entry) => entry.performedBy === appliedBy);
        }
        if (currentFilters.start) {
          data = data.filter(
            (entry) => new Date(entry.date) >= new Date(currentFilters.start),
          );
        }
        if (currentFilters.end) {
          data = data.filter(
            (entry) => new Date(entry.date) <= new Date(currentFilters.end),
          );
        }
        return data;
      },
      onFiltersApplied: (filteredEntries) => {
        onFilter?.(filteredEntries);
      },
      extractCurrency: (entry) =>
        (entry as (AdminTransactionEntry & { currency?: string }) | undefined)
          ?.currency,
    },
    queries: filterQueries,
  });

  const filtersQuery = queries.filters;
  const filterOptions: FilterOptions = filtersQuery?.data ?? {
    types: [],
    performedBy: [],
  };

  const typeOptions = useMemo(
    () =>
      buildSelectOptions({
        data: filterOptions?.types ?? [],
        getValue: (value) => value,
        getLabel: (value) => value,
        prependOptions: [{ value: 'All Types', label: 'All Types' }],
        filter: (value) => value !== 'All Types',
      }),
    [filterOptions],
  );

  const performedByOptions = useMemo(
    () =>
      buildSelectOptions({
        data: filterOptions?.performedBy ?? [],
        getValue: (value) => value,
        getLabel: (value) => (value === 'All' ? 'Performed By: All' : value),
        prependOptions: [{ value: 'All', label: 'Performed By: All' }],
        filter: (value) => value !== 'All',
      }),
    [filterOptions],
  );

  const [typePlaceholder, ...typeSelectableOptions] = typeOptions;
  const [performedByPlaceholder, ...performedBySelectableOptions] =
    performedByOptions;

  const defaultType = typePlaceholder?.value ?? '';
  const defaultBy = performedByPlaceholder?.value ?? '';

  defaultTypeRef.current = defaultType;
  defaultByRef.current = defaultBy;

  const {
    data: entries = [],
    isLoading: historyLoading,
    error: historyError,
    currency,
    filters,
    updateFilter,
    syncFilters,
    applyFilters,
  } = history;

  useEffect(() => {
    const nextType = filters.type || defaultType;
    const nextBy = filters.by || defaultBy;
    if (!nextType && !nextBy) return;
    if (nextType === filters.type && nextBy === filters.by) return;
    syncFilters({
      ...filters,
      type: nextType,
      by: nextBy,
    });
  }, [defaultBy, defaultType, filters, syncFilters]);

  const columns = useMemo<Column<Transaction>[]>(
    () =>
      colMeta.map((c) => ({
        header: c.label,
        headerClassName: commonOpts.headerClassName,
        cellClassName:
          c.id === 'notes'
            ? 'py-3 px-2 text-text-secondary'
            : commonOpts.cellClassName,
        cell: (t: Transaction) => {
          switch (c.id) {
            case 'amount':
              return <AmountCell amount={t.amount} currency={currency} />;
            case 'status':
              return <StatusCell status={t.status} />;
            default:
              return (t as any)[c.id as keyof Transaction] ?? '';
          }
        },
      })),
    [colMeta, currency],
  );

  const loading = filtersQuery?.isLoading || historyLoading || colsLoading;
  const error = filtersQuery?.error || historyError || colsError;

  const tableData: Transaction[] = useMemo(
    () =>
      entries.map(({ date, performedBy, ...rest }) => ({
        datetime: date,
        by: performedBy,
        ...rest,
      })),
    [entries],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-dark pb-4 mb-4">
        <h3 className="text-xl font-bold">
          Transaction History -{' '}
          <span className="text-accent-yellow">{userName || 'Player'}</span>
        </h3>
        <button
          onClick={onClose}
          aria-label="Close transaction history modal"
          className="text-text-secondary hover:text-text-primary text-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500">
          Failed to load transactions
        </div>
      ) : (
        <>
          <TransactionHistoryFilters
            className="pb-4 mb-4 border-b border-dark"
            filters={filters}
            onChange={updateFilter}
            dateRange={{
              startKey: 'start',
              endKey: 'end',
              startLabel: 'Start date',
              endLabel: 'End date',
            }}
            inputClassName="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            selectClassName="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            selects={[
              {
                key: 'type',
                label: 'Filter by type',
                placeholderOption: typePlaceholder,
                options: typeSelectableOptions,
                loading: filtersQuery?.isLoading,
                error: Boolean(filtersQuery?.error),
              },
              {
                key: 'by',
                label: 'Filter by performer',
                placeholderOption: performedByPlaceholder,
                options: performedBySelectableOptions,
                loading: filtersQuery?.isLoading,
                error: Boolean(filtersQuery?.error),
              },
            ]}
            onApply={() => applyFilters()}
            applyButtonLabel="Apply"
            applyButtonClassName="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-semibold transition"
            applyButtonDisabled={historyLoading}
          />

          <TransactionHistoryTable
            data={tableData}
            columns={columns}
            getRowKey={(_, idx) => idx}
            estimateSize={52}
            containerClassName="max-h-96 overflow-auto"
            tableClassName="w-full text-sm"
            rowClassName="border-b border-dark hover:bg-hover-bg"
            noDataMessage={
              <div className="p-6 text-center text-text-secondary">
                No transactions
              </div>
            }
          />
        </>
      )}
    </Modal>
  );
}
