'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faFilter,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';

import SearchBar from './SearchBar';
import QuickStats from './QuickStats';
import ActivityChart from '../charts/ActivityChart';
import RevenueDonut from '../charts/RevenueDonut';
import ErrorChart from './ErrorChart';
import PaletteEditor from './PaletteEditor';
import AuditTable from './AuditTable';
import AdvancedFilterModal from './AdvancedFilterModal';
import DetailModal from './DetailModal';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useActivity } from '@/hooks/useActivity';
import { useAuditSummary } from '@/hooks/useAuditSummary';
import { useRevenueBreakdown } from '@/hooks/useRevenueBreakdown';
import SecurityAlerts from './SecurityAlerts';
import CenteredMessage from '@/components/CenteredMessage';
import ToastNotification from '../../ui/ToastNotification';
import RevenueBreakdownCard from './RevenueBreakdownCard';
import { rebuildLeaderboard } from '@/lib/api/leaderboard';
import type {
  AuditLogEntry,
  AuditLogType,
  AuditLogsResponse,
  LogTypeClasses,
} from '@shared/types';
import { AuditLogEntrySchema } from '@shared/schemas/analytics';
import {
  fetchLogTypeClasses,
  fetchErrorCategories,
  markAuditLogReviewed,
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
  const queryClient = useQueryClient();
  const [reviewError, setReviewError] = useState<string | null>(null);

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
  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = useAuditSummary();
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
  const {
    data: revenueStreams,
    isLoading: revenueLoading,
    isError: revenueError,
    error: revenueErrorDetails,
  } = useRevenueBreakdown('all');
  const revenueBreakdown = revenueStreams;
  const { toasts, pushToast } = useToasts();
  const reviewMutation = useMutation({
    mutationFn: (id: AuditLogEntry['id']) => markAuditLogReviewed(id),
    onSuccess: (updated) => {
      queryClient.setQueriesData<AuditLogsResponse>(
        { queryKey: ['audit-logs'] },
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            logs: prev.logs.map((log) =>
              log.id === updated.id ? updated : log,
            ),
          };
        },
      );
      setShowDetail((prev) =>
        prev && prev.id === updated.id ? updated : prev,
      );
      setReviewError(null);
      pushToast('Log marked as reviewed');
    },
    onError: () => {
      setReviewError('Failed to mark log as reviewed');
      pushToast('Failed to mark log as reviewed', { variant: 'error' });
    },
  });
  const rebuild = useMutation({
    mutationFn: () => rebuildLeaderboard(),
    onSuccess: () => pushToast('Leaderboard rebuild started'),
    onError: () =>
      pushToast('Failed to rebuild leaderboard', { variant: 'error' }),
  });

  const handleReview = () => {
    if (!showDetail || showDetail.reviewed || reviewMutation.isPending) return;
    reviewMutation.mutate(showDetail.id);
  };

  const handleCloseDetail = () => {
    setReviewError(null);
    reviewMutation.reset();
    setShowDetail(null);
  };

  const handleViewDetail = (row: AuditLogEntry) => {
    setReviewError(null);
    setShowDetail(row);
  };

  if (badgeLoading)
    return <CenteredMessage>Loading log types...</CenteredMessage>;
  if (badgeError)
    return <CenteredMessage>Failed to load log types</CenteredMessage>;
  if (!badgeClasses || Object.keys(badgeClasses).length === 0)
    return <CenteredMessage>No log types found</CenteredMessage>;

  const rows = logs;

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
        {summaryLoading ? (
          <CenteredMessage>Loading overview...</CenteredMessage>
        ) : summaryError ? (
          <CenteredMessage>Failed to load overview</CenteredMessage>
        ) : (
          <QuickStats
            total={summary.total}
            errors={summary.errors}
            logins={summary.logins}
          />
        )}
        <SecurityAlerts />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
          <h3 className="text-lg font-bold mb-4">Revenue Breakdown</h3>
          {revenueLoading ? (
            <CenteredMessage>Loading revenue...</CenteredMessage>
          ) : revenueError ? (
            <CenteredMessage>Failed to load revenue</CenteredMessage>
          ) : !revenueStreams || revenueStreams.length === 0 ? (
            <CenteredMessage>No data</CenteredMessage>
          ) : (
            <RevenueDonut streams={revenueStreams} />
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6">
        <RevenueBreakdownCard
          streams={revenueBreakdown}
          loading={revenueLoading}
          error={
            revenueError
              ? (revenueErrorDetails?.message ??
                'Failed to load revenue breakdown')
              : undefined
          }
        />
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
          onView={handleViewDetail}
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
        onClose={handleCloseDetail}
        badgeClasses={badgeClasses}
        onMarkReviewed={handleReview}
        reviewLoading={reviewMutation.isPending}
        reviewError={reviewError}
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
