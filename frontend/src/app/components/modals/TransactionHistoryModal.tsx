'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useQuery } from '@tanstack/react-query';
import TransactionHistoryTable from '@/app/components/common/TransactionHistoryTable';
import {
  transactionColumns,
  type Transaction,
} from '../dashboard/transactions/transactionColumns';
import {
  fetchTransactionFilters,
  fetchUserTransactions,
} from '@/lib/api/transactions';
import type { FilterOptions } from '@shared/transactions.schema';
import { AdminTransactionEntriesSchema } from '@shared/transactions.schema';
import { z } from 'zod';

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
    data: entries = [],
    isLoading: txLoading,
    error: txError,
  } = useQuery<AdminTransactionEntry[]>({
    queryKey: ['userTransactions', userId],
    queryFn: () => fetchUserTransactions(userId),
    enabled: isOpen && !!userId,
  });

  const loading = filtersLoading || txLoading;
  const error = filtersError || txError;
  // inputs (pending)
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [type, setType] = useState('');
  const [by, setBy] = useState('');

  // applied filters (after clicking Apply)
  const [applied, setApplied] = useState<{
    start: string;
    end: string;
    type: string;
    by: string;
  }>({
    start: '',
    end: '',
    type: '',
    by: '',
  });
  const performedByOptions =
    filterOptions?.performedBy.map((p) => ({
      label: p === 'All' ? 'Performed By: All' : p,
      value: p,
    })) ?? [];
  const typeOptions = filterOptions?.types ?? [];

  useEffect(() => {
    if (filterOptions) {
      const defaultType = filterOptions.types[0] ?? '';
      const defaultBy = filterOptions.performedBy[0] ?? '';
      setType((prev) => prev || defaultType);
      setBy((prev) => prev || defaultBy);
      setApplied((prev) => ({
        ...prev,
        type: prev.type || defaultType,
        by: prev.by || defaultBy,
      }));
    }
  }, [filterOptions]);

  const defaultType = typeOptions[0];
  const defaultBy = performedByOptions[0]?.value;

  const filtered = useMemo(() => {
    let data = [...entries];
    if (applied.type && defaultType && applied.type !== defaultType)
      data = data.filter((e) => e.action === applied.type);
    if (applied.by && defaultBy && applied.by !== defaultBy)
      data = data.filter((e) => e.performedBy === applied.by);
    if (applied.start)
      data = data.filter((e) => new Date(e.date) >= new Date(applied.start));
    if (applied.end)
      data = data.filter((e) => new Date(e.date) <= new Date(applied.end));
    return data;
  }, [entries, applied]);

  const tableData: Transaction[] = useMemo(
    () =>
      filtered.map(({ date, performedBy, ...rest }) => ({
        datetime: date,
        by: performedBy,
        ...rest,
      })),
    [filtered],
  );

  const apply = () => {
    const next = { start, end, type, by };
    setApplied(next);
    onFilter?.(
      [...entries].filter((e) => {
        if (defaultType && next.type !== defaultType && e.action !== next.type)
          return false;
        if (defaultBy && next.by !== defaultBy && e.performedBy !== next.by)
          return false;
        if (next.start && new Date(e.date) < new Date(next.start)) return false;
        if (next.end && new Date(e.date) > new Date(next.end)) return false;
        return true;
      }),
    );
  };

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
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            >
              {typeOptions.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={by}
              onChange={(e) => setBy(e.target.value)}
              className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            >
              {performedByOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={apply}
              className="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              Apply
            </button>
          </div>

          <TransactionHistoryTable
            data={tableData}
            columns={transactionColumns}
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
