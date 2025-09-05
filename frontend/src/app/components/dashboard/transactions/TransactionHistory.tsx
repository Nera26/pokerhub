import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

import StatusPill, { toStatus } from './StatusPill';
import type { Txn } from './types';
import TransactionHistoryTable, {
  Column,
} from '@/app/components/common/TransactionHistoryTable';

const usd = (n: number) =>
  (n < 0 ? '-' : n > 0 ? '+' : '') + '$' + Math.abs(n).toLocaleString();

interface Props {
  log: Txn[];
  pageInfo: string;
  onExport: () => void;
}

export default function TransactionHistory({ log, pageInfo, onExport }: Props) {
  const columns: Column<Txn>[] = [
    {
      header: 'Date & Time',
      headerClassName: 'text-left py-3 px-2 text-text-secondary',
      cell: (t) => t.datetime,
      cellClassName: 'py-3 px-2 text-text-secondary',
    },
    {
      header: 'Action',
      headerClassName: 'text-left py-3 px-2 text-text-secondary',
      cell: (t) => t.action,
      cellClassName: 'py-3 px-2',
    },
    {
      header: 'Amount',
      headerClassName: 'text-left py-3 px-2 text-text-secondary',
      cell: (t) => (
        <span
          className={
            t.amount > 0
              ? 'text-accent-green'
              : t.amount < 0
                ? 'text-danger-red'
                : ''
          }
        >
          {usd(t.amount)}
        </span>
      ),
      cellClassName: 'py-3 px-2 font-semibold',
    },
    {
      header: 'Performed By',
      headerClassName: 'text-left py-3 px-2 text-text-secondary',
      cell: (t) => t.by,
      cellClassName: 'py-3 px-2',
    },
    {
      header: 'Notes',
      headerClassName: 'text-left py-3 px-2 text-text-secondary',
      cell: (t) => t.notes,
      cellClassName: 'py-3 px-2 text-text-secondary',
    },
    {
      header: 'Status',
      headerClassName: 'text-left py-3 px-2 text-text-secondary',
      cell: (t) => <StatusPill status={toStatus(t.status)} />,
      cellClassName: 'py-3 px-2',
    },
  ];

  return (
    <section>
      <div className="bg-card-bg p-6 rounded-2xl card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Unified Transaction Log</h3>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <input
                type="date"
                className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
              />
              <input
                type="date"
                className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
              />
              <select className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm">
                <option>All Players</option>
                <option>Mike_P</option>
                <option>Sarah_K</option>
                <option>Alex_R</option>
              </select>
              <select className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm">
                <option>All Types</option>
                <option>Deposit</option>
                <option>Withdrawal</option>
                <option>Manual Add</option>
                <option>Manual Remove</option>
                <option>Freeze</option>
              </select>
            </div>
            <button
              onClick={onExport}
              className="bg-accent-blue hover:brightness-110 px-4 py-2 rounded-2xl font-semibold text-sm"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <TransactionHistoryTable
          data={log}
          columns={columns}
          getRowKey={(_, i) => i}
          estimateSize={52}
          containerClassName="overflow-auto max-h-96"
          tableClassName="w-full text-sm"
          rowClassName="border-b border-dark hover:bg-hover-bg"
        />

        <div className="flex justify-between items-center mt-4">
          <span className="text-text-secondary text-sm">{pageInfo}</span>
          <div className="flex gap-2">
            <button className="bg-hover-bg hover:bg-accent-yellow hover:text-black px-3 py-2 rounded-2xl text-sm">
              Previous
            </button>
            <button className="bg-accent-yellow text-black px-3 py-2 rounded-2xl text-sm">
              1
            </button>
            <button className="bg-hover-bg hover:bg-accent-yellow hover:text-black px-3 py-2 rounded-2xl text-sm">
              2
            </button>
            <button className="bg-hover-bg hover:bg-accent-yellow hover:text-black px-3 py-2 rounded-2xl text-sm">
              3
            </button>
            <button className="bg-hover-bg hover:bg-accent-yellow hover:text-black px-3 py-2 rounded-2xl text-sm">
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

