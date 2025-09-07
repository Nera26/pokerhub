import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import type { ReactNode } from 'react';
import TransactionHistoryTable, {
  type Column,
  type Action,
} from './TransactionHistoryTable';

export interface TransactionHistoryProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  onExport?: () => void;
  headerSlot?: ReactNode;
  emptyState?: ReactNode;
}

export default function TransactionHistory<T>({
  data,
  columns,
  actions,
  onExport,
  headerSlot,
  emptyState,
}: TransactionHistoryProps<T>) {
  return (
    <section>
      <div className="bg-card-bg p-6 rounded-2xl card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Transaction History</h3>
          <div className="flex items-center gap-4">
            {headerSlot}
            {onExport && (
              <button
                onClick={onExport}
                className="bg-accent-blue hover:brightness-110 px-4 py-2 rounded-2xl font-semibold text-sm"
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        <TransactionHistoryTable
          data={data}
          columns={columns}
          actions={actions}
          getRowKey={(_, i) => i}
          estimateSize={52}
          containerClassName="overflow-auto max-h-96"
          tableClassName="w-full text-sm"
          rowClassName="border-b border-dark hover:bg-hover-bg"
          noDataMessage={emptyState}
        />

        <div className="flex justify-between items-center mt-4">
          <span className="text-text-secondary text-sm">
            Showing {data.length} entries
          </span>
          <div className="flex gap-2">
            <button className="bg-hover-bg hover:bg-accent-yellow hover:text-black px-3 py-2 rounded-2xl text-sm">
              Previous
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

