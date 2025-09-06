'use client';

import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFilter, faTrophy } from '@fortawesome/free-solid-svg-icons';

import SearchBar from './SearchBar';
import QuickStats from './QuickStats';
import ActivityChart from '../charts/ActivityChart';
import ErrorChart from './ErrorChart';
import AuditTable from './AuditTable';
import AdvancedFilterModal from './AdvancedFilterModal';
import DetailModal from './DetailModal';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuditSummary } from '@/hooks/useAuditSummary';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import CenteredMessage from '@/components/CenteredMessage';
import ToastNotification from '../../ui/ToastNotification';
import { rebuildLeaderboard } from '@/lib/api/leaderboard';
import type { AuditLogEntry, AuditLogType } from '@shared/types';

export default function Analytics() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | AuditLogType>('all');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDetail, setShowDetail] = useState<AuditLogEntry | null>(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [resultLimit, setResultLimit] = useState(25);

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { data } = useAuditLogs();
  const logs = data?.logs ?? [];
  const { data: summary } = useAuditSummary();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();

  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error';
    open: boolean;
  }>({ msg: '', type: 'success', open: false });
  const notify = (
    msg: string,
    type: 'success' | 'error' = 'success',
  ) => setToast({ msg, type, open: true });

  const rebuild = useMutation({
    mutationFn: () => rebuildLeaderboard(),
    onSuccess: () => notify('Leaderboard rebuild started'),
    onError: () => notify('Failed to rebuild leaderboard', 'error'),
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let rows = logs.filter((r) => {
      const textOk =
        !s ||
        `${r.timestamp} ${r.type} ${r.description} ${r.user} ${r.ip}`
          .toLowerCase()
          .includes(s);
      const typeOk = type === 'all' || r.type === type;
      return textOk && typeOk;
    });

    if (userFilter.trim()) {
      rows = rows.filter((r) =>
        `${r.user}`.toLowerCase().includes(userFilter.trim().toLowerCase()),
      );
    }
      if (dateFrom) {
        rows = rows.filter((r) => new Date(r.timestamp) >= new Date(dateFrom));
      }
      if (dateTo) {
        rows = rows.filter(
          (r) => new Date(r.timestamp) <= new Date(dateTo + ' 23:59:59'),
        );
      }

    return rows.slice(0, resultLimit);
  }, [logs, search, type, userFilter, dateFrom, dateTo, resultLimit]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  const statTotal = summary?.total ?? 0;
  const statErrors = summary?.errors ?? 0;
  const statLogins = summary?.logins ?? 0;

  const exportCSV = () => {
    const header = 'Date,Type,Description,User\n';
    const body = filtered
      .map((r) => `${r.timestamp},${r.type},"${r.description}",${r.user}`)
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + header + body;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyAdvanced = () => {
    setShowAdvanced(false);
    setPage(1);
  };

  const clearAdvanced = () => {
    setDateFrom('');
    setDateTo('');
    setUserFilter('');
    setResultLimit(25);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Audit Logs</h2>
          <p className="text-text-secondary">
            Track system events, errors, and user activities
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl font-semibold text-white flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faDownload} />
            Export
          </button>
          <button
            onClick={() => setShowAdvanced(true)}
            className="border-2 border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-black px-4 py-2 rounded-xl font-semibold"
          >
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Filter
          </button>
          <button
            onClick={() => rebuild.mutate()}
            className="bg-accent-green hover:bg-green-600 px-4 py-2 rounded-xl font-semibold text-white flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faTrophy} />
            Rebuild Leaderboard
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SearchBar
          search={search}
          setSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          type={type}
          setType={(v) => {
            setType(v);
            setPage(1);
          }}
          onSubmit={() => setPage(1)}
        />
        <QuickStats total={statTotal} errors={statErrors} logins={statLogins} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metricsLoading ? (
          <CenteredMessage>Loading metrics...</CenteredMessage>
        ) : (
          <ActivityChart data={metrics?.activity} showContainer />
        )}
        {metricsLoading ? (
          <CenteredMessage>Loading metrics...</CenteredMessage>
        ) : (
          <ErrorChart data={metrics?.errors} />
        )}
      </section>

      <AuditTable
        rows={rows}
        page={page}
        pageCount={pageCount}
        start={start}
        total={total}
        setPage={setPage}
        onView={setShowDetail}
      />

      <AdvancedFilterModal
        open={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        resultLimit={resultLimit}
        setResultLimit={setResultLimit}
        onApply={applyAdvanced}
        onClear={clearAdvanced}
      />

      <DetailModal row={showDetail} onClose={() => setShowDetail(null)} />

      <ToastNotification
        message={toast.msg}
        type={toast.type}
        isOpen={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
