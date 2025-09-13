'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faFilter,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';

import SearchBar from './SearchBar';
import QuickStats from './QuickStats';
import ActivityChart from '../charts/ActivityChart';
import ErrorChart from './ErrorChart';
import PaletteEditor from './PaletteEditor';
import AuditTable from './AuditTable';
import AdvancedFilterModal from './AdvancedFilterModal';
import DetailModal from './DetailModal';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuditSummary } from '@/hooks/useAuditSummary';
import { useActivity } from '@/hooks/useActivity';
import SecurityAlerts from './SecurityAlerts';
import CenteredMessage from '@/components/CenteredMessage';
import ToastNotification from '../../ui/ToastNotification';
import { rebuildLeaderboard } from '@/lib/api/leaderboard';
import type {
  AuditLogEntry,
  AuditLogType,
  LogTypeClasses,
} from '@shared/types';
import { AuditLogEntrySchema } from '@shared/schemas/analytics';
import {
  fetchLogTypeClasses,
  fetchErrorCategories,
  type ErrorCategoriesResponse,
} from '@/lib/api/analytics';
import useToasts from '@/hooks/useToasts';
import { exportCsv } from '@/lib/exportCsv';

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

  const {
    data: badgeClasses,
    isLoading: badgeLoading,
    isError: badgeError,
  } = useQuery<LogTypeClasses>({
    queryKey: ['log-type-classes'],
    queryFn: fetchLogTypeClasses,
  });

  const {
    data: logData,
    isLoading: logsLoading,
    isError: logsError,
  } = useAuditLogs({
    search,
    type: type === 'all' ? undefined : type,
    user: userFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: resultLimit,
  });
  const logs = logData?.logs ?? [];
  const total = logData?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / resultLimit));
  const start = (page - 1) * resultLimit;
  const { data: summary } = useAuditSummary();
  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
  } = useActivity();
  const {
    data: errorCategories,
    isLoading: errorCategoriesLoading,
    isError: errorCategoriesError,
  } = useQuery<ErrorCategoriesResponse>({
    queryKey: ['error-categories'],
    queryFn: fetchErrorCategories,
  });
  const { toasts, pushToast } = useToasts();
  const rebuild = useMutation({
    mutationFn: () => rebuildLeaderboard(),
    onSuccess: () => pushToast('Leaderboard rebuild started'),
    onError: () =>
      pushToast('Failed to rebuild leaderboard', { variant: 'error' }),
  });

  if (badgeLoading)
    return <CenteredMessage>Loading log types...</CenteredMessage>;
  if (badgeError)
    return <CenteredMessage>Failed to load log types</CenteredMessage>;
  if (!badgeClasses || Object.keys(badgeClasses).length === 0)
    return <CenteredMessage>No log types found</CenteredMessage>;

  const rows = logs;
  const statTotal = summary?.total ?? 0;
  const statErrors = summary?.errors ?? 0;
  const statLogins = summary?.logins ?? 0;

  const exportCSV = () => {
    const keys = Object.keys(
      AuditLogEntrySchema.shape,
    ) as (keyof AuditLogEntry)[];
    const header = keys;
    const rows = logs.map((r) =>
      keys.map((k) =>
        k === 'description' ? `"${r[k] ?? ''}"` : String(r[k] ?? ''),
      ),
    );
    exportCsv(
      `audit_logs_${new Date().toISOString().split('T')[0]}.csv`,
      header,
      rows,
    );
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
        <SecurityAlerts />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activityLoading ? (
          <CenteredMessage>Loading activity...</CenteredMessage>
        ) : activityError ? (
          <CenteredMessage>Failed to load activity</CenteredMessage>
        ) : (
          <ActivityChart
            labels={activity?.labels}
            data={activity?.data}
            showContainer
          />
        )}
        {errorCategoriesLoading ? (
          <CenteredMessage>Loading error categories...</CenteredMessage>
        ) : errorCategoriesError ? (
          <CenteredMessage>Failed to load error categories</CenteredMessage>
        ) : (
          <ErrorChart
            labels={errorCategories?.labels}
            data={errorCategories?.counts}
          />
        )}
      </section>

      <section className="grid grid-cols-1 gap-6">
        <PaletteEditor />
      </section>

      {logsLoading ? (
        <CenteredMessage>Loading audit logs...</CenteredMessage>
      ) : logsError ? (
        <CenteredMessage>Failed to load audit logs</CenteredMessage>
      ) : rows.length === 0 ? (
        <CenteredMessage>No audit logs found</CenteredMessage>
      ) : (
        <AuditTable
          rows={rows}
          page={page}
          pageCount={pageCount}
          start={start}
          total={total}
          setPage={setPage}
          onView={setShowDetail}
          badgeClasses={badgeClasses}
        />
      )}

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

      <DetailModal
        row={showDetail}
        onClose={() => setShowDetail(null)}
        badgeClasses={badgeClasses}
      />

      {toasts.map((t) => (
        <ToastNotification
          key={t.id}
          message={t.message}
          type={t.variant === 'error' ? 'error' : 'success'}
          isOpen
          duration={t.duration}
          onClose={() => {}}
        />
      ))}
    </div>
  );
}
