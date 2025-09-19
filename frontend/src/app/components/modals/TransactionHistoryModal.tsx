'use client';

import { useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useQuery } from '@tanstack/react-query';
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
import useTransactionHistory from '@/app/components/common/useTransactionHistory';

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
  const {
    data: filterOptions,
    isLoading: filtersLoading,
    error: filtersError,
  } = useQuery<FilterOptions>({
    queryKey: ['transactionFilters'],
    queryFn: fetchTransactionFilters,
    enabled: isOpen,
  });

  const {
    data: colMeta = [],
    isLoading: colsLoading,
    error: colsError,
  } = useTransactionColumns();

  const typeOptions = useMemo(() => {
    const fromServer = filterOptions?.types ?? [];
    const withoutAll = fromServer.filter((type) => type !== 'All Types');
    return ['All Types', ...withoutAll];
  }, [filterOptions]);

  const performedByOptions = useMemo(() => {
    const fromServer = filterOptions?.performedBy ?? [];
    const withoutAll = fromServer.filter((value) => value !== 'All');
    return ['All', ...withoutAll].map((p) => ({
      label: p === 'All' ? 'Performed By: All' : p,
      value: p,
    }));
  }, [filterOptions]);

  const defaultType = typeOptions[0] ?? '';
  const defaultBy = performedByOptions[0]?.value ?? '';

  const {
    data: entries = [],
    isLoading: historyLoading,
    error: historyError,
    currency,
    filters,
    updateFilter,
    syncFilters,
    applyFilters,
  } = useTransactionHistory<AdminTransactionEntry>({
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
      if (appliedType && defaultType && appliedType !== defaultType) {
        data = data.filter((entry) => entry.action === appliedType);
      }
      if (appliedBy && defaultBy && appliedBy !== defaultBy) {
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
  });

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

  const loading = filtersLoading || historyLoading || colsLoading;
  const error = filtersError || historyError || colsError;

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
          {/* Filters (with Apply) */}
          <div className="flex flex-wrap gap-3 pb-4 mb-4 border-b border-dark">
            <input
              type="date"
              value={filters.start ?? ''}
              onChange={(e) => updateFilter('start', e.target.value)}
              className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={filters.end ?? ''}
              onChange={(e) => updateFilter('end', e.target.value)}
              className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            />
            <select
              value={filters.type || defaultType || ''}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            >
              {typeOptions.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={filters.by || defaultBy || ''}
              onChange={(e) => updateFilter('by', e.target.value)}
              className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            >
              {performedByOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => applyFilters()}
              className="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              Apply
            </button>
          </div>

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
