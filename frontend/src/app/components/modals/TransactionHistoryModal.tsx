'use client';

import { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import TransactionHistoryTable from '@/app/components/common/TransactionHistoryTable';
import { buildColumns } from '@/app/components/wallet/transactionColumns';

export enum PerformedBy {
  All = 'All',
  Admin = 'Admin',
  User = 'User',
  System = 'System',
}

export type TransactionEntry = {
  date: string; // "Dec 15, 2024 14:32"
  action: string;
  amount: number;
  performedBy: Exclude<PerformedBy, PerformedBy.All>;
  notes: string;
  status: 'Completed' | 'Pending' | 'Rejected';
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  entries: TransactionEntry[];
  onFilter?: (filtered: TransactionEntry[]) => void;
}

export default function TransactionHistoryModal({
  isOpen,
  onClose,
  userName,
  entries,
  onFilter,
}: Props) {
  // inputs (pending)
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [type, setType] = useState<string>('All Types');
  const [by, setBy] = useState<PerformedBy>(PerformedBy.All);

  // applied filters (after clicking Apply)
  const [applied, setApplied] = useState<{
    start: string;
    end: string;
    type: string;
    by: PerformedBy;
  }>({
    start: '',
    end: '',
    type: 'All Types',
    by: PerformedBy.All,
  });

  const performedByOptions = [
    { label: 'Performed By: All', value: PerformedBy.All },
    { label: 'Admin', value: PerformedBy.Admin },
    { label: 'System', value: PerformedBy.System },
    { label: 'User', value: PerformedBy.User },
  ];

  const filtered = useMemo(() => {
    let data = [...entries];
    if (applied.type !== 'All Types')
      data = data.filter((e) => e.action === applied.type);
    if (applied.by !== PerformedBy.All)
      data = data.filter((e) => e.performedBy === applied.by);
    if (applied.start)
      data = data.filter((e) => new Date(e.date) >= new Date(applied.start));
    if (applied.end)
      data = data.filter((e) => new Date(e.date) <= new Date(applied.end));
    return data;
  }, [entries, applied]);

  const apply = () => {
    const next = { start, end, type, by };
    setApplied(next);
    onFilter?.(
      [...entries].filter((e) => {
        if (next.type !== 'All Types' && e.action !== next.type) return false;
        if (next.by !== PerformedBy.All && e.performedBy !== next.by)
          return false;
        if (next.start && new Date(e.date) < new Date(next.start)) return false;
        if (next.end && new Date(e.date) > new Date(next.end)) return false;
        return true;
      }),
    );
  };

  const columns = useMemo(
    () => buildColumns<TransactionEntry>((t) => t.action),
    [],
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
          <option>All Types</option>
          <option>Admin Add</option>
          <option>Admin Remove</option>
          <option>Withdrawal</option>
          <option>Deposit</option>
          <option>Bonus</option>
          <option>Game Buy-in</option>
          <option>Winnings</option>
        </select>
        <select
          value={by}
          onChange={(e) => setBy(e.target.value as PerformedBy)}
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
        data={filtered}
        columns={columns}
        noDataMessage={
          <div className="p-6 text-center text-text-secondary">
            No transactions
          </div>
        }
      />
    </Modal>
  );
}
