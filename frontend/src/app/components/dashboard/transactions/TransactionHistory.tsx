import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useQuery } from '@tanstack/react-query';

import type { Txn } from './types';
import TransactionHistoryTable from '@/app/components/common/TransactionHistoryTable';
import { transactionColumns } from './transactionColumns';
import { fetchAdminPlayers, fetchTransactionTypes } from '@/lib/api/wallet';
import { useApiError } from '@/hooks/useApiError';

interface Props {
  log: Txn[];
  pageInfo: string;
  onExport: () => void;
  selectedPlayer: string;
  selectedType: string;
  onPlayerChange: (playerId: string) => void;
  onTypeChange: (type: string) => void;
}

export default function TransactionHistory({
  log,
  pageInfo,
  onExport,
  selectedPlayer,
  selectedType,
  onPlayerChange,
  onTypeChange,
}: Props) {
  const {
    data: players = [],
    isLoading: playersLoading,
    error: playersError,
  } = useQuery({ queryKey: ['adminPlayers'], queryFn: fetchAdminPlayers });
  const {
    data: types = [],
    isLoading: typesLoading,
    error: typesError,
  } = useQuery({
    queryKey: ['transactionTypes'],
    queryFn: fetchTransactionTypes,
  });

  useApiError(playersError);
  useApiError(typesError);
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
              <select
                className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
                value={selectedPlayer}
                onChange={(e) => onPlayerChange(e.target.value)}
              >
                <option value="">All Players</option>
                {playersLoading ? (
                  <option disabled>Loading...</option>
                ) : playersError ? (
                  <option disabled>Failed to load</option>
                ) : (
                  players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username}
                    </option>
                  ))
                )}
              </select>
              <select
                className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
                value={selectedType}
                onChange={(e) => onTypeChange(e.target.value)}
              >
                <option value="">All Types</option>
                {typesLoading ? (
                  <option disabled>Loading...</option>
                ) : typesError ? (
                  <option disabled>Failed to load</option>
                ) : (
                  types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))
                )}
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
          columns={transactionColumns}
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

