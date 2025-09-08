'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import VirtualizedList from '@/components/VirtualizedList';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate as faRotateRight,
  faShieldHalved,
  faFlag,
} from '@fortawesome/free-solid-svg-icons';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuditAlerts } from '@/hooks/useAuditAlerts';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import type { AlertItem } from '@shared/types';
import StatusPill from './common/StatusPill';

type AuditStatus = 'Success' | 'Warning' | 'Failed';

export const auditStyles: Record<AuditStatus, string> = {
  Success: 'bg-accent-green text-text-primary',
  Warning: 'bg-accent-yellow text-black',
  Failed: 'bg-danger-red text-text-primary',
};

type AuditLogEntry = {
  timestamp: string;
  admin: string;
  user: string;
  action: string;
  description: string;
  status: AuditStatus;
};

export default function AuditLogs() {
  // filters
  const filterSchema = z.object({
    date: z.string().optional(),
    action: z.string().optional(),
    performer: z.string().optional(),
    user: z.string().optional(),
  });

  type FilterForm = z.infer<typeof filterSchema>;

  const { register, watch, setValue } = useForm<FilterForm>({
    resolver: zodResolver(filterSchema),
    defaultValues: { date: '', action: '', performer: '', user: '' },
  });

  const { date = '', action = '', performer = '', user = '' } = watch();

  const {
    data: logData,
    isLoading: logsLoading,
    error: logsError,
  } = useAuditLogs();

  const rows = useMemo<AuditLogEntry[]>(
    () =>
      (logData?.logs ?? []).map((l) => ({
        timestamp: l.timestamp,
        admin: l.user ?? '-',
        user: l.user ?? '-',
        action: l.type,
        description: l.description,
        status: l.type === 'Error' ? 'Failed' : 'Success',
      })),
    [logData],
  );

  // sorting
  const [sortBy, setSortBy] = useState<'timestamp' | 'admin' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const toggleSort = (key: 'timestamp' | 'admin') => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  // filter + sort
  const filtered = useMemo(() => {
    const d = date.trim();
    const a = action.trim().toLowerCase();
    const p = performer.trim().toLowerCase();
    const u = user.trim().toLowerCase();

    let out = rows.filter((r) => {
      const matchDate = d ? r.timestamp.startsWith(d) : true;
      const matchAction = a ? r.action.toLowerCase().includes(a) : true;
      const matchPerf = p ? r.admin.toLowerCase().includes(p) : true;
      const matchUser = u ? r.user.toLowerCase().includes(u) : true;
      return matchDate && matchAction && matchPerf && matchUser;
    });

    if (sortBy) {
      out = [...out].sort((x, y) => {
        const ax = sortBy === 'timestamp' ? x.timestamp : x.admin;
        const ay = sortBy === 'timestamp' ? y.timestamp : y.admin;
        const cmp = ax.localeCompare(ay);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, date, action, performer, user, sortBy, sortDir]);

  // Admin overview (click to filter)
  const {
    data: adminsData,
    isLoading: adminsLoading,
    error: adminsError,
  } = useAdminOverview();
  const admins = adminsData ?? [];

  // Security alerts (solid bars like your HTML screenshot)
  const {
    data: alertsData,
    isLoading: alertsLoading,
    error: alertsError,
  } = useAuditAlerts();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  useEffect(() => {
    if (alertsData) setAlerts(alertsData);
  }, [alertsData]);

  if (logsLoading || alertsLoading || adminsLoading) {
    return <div aria-label="loading">Loading...</div>;
  }
  if (logsError || alertsError || adminsError) {
    return (
      <div role="alert">
        {(logsError || alertsError || adminsError)?.message}
      </div>
    );
  }
  const markResolved = (id: string) =>
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)),
    );

  // CSV (filtered)
  const exportCSV = () => {
    const header = [
      'Timestamp',
      'Admin',
      'Affected User',
      'Action Type',
      'Description',
      'Status',
    ];
    const body = filtered.map((r) => [
      r.timestamp,
      r.admin,
      r.user,
      r.action,
      `"${r.description.replace(/"/g, '""')}"`,
      r.status,
    ]);
    const csv = [header, ...body].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement('a');
    aEl.href = url;
    aEl.download = 'audit_logs.csv';
    aEl.click();
    URL.revokeObjectURL(url);
  };

  // map action to color (includes “User Ban”)
  const actionColor = (label: string) => {
    const t = label.toLowerCase();
    if (t.includes('add balance')) return 'text-accent-green';
    if (t.includes('remove balance')) return 'text-danger-red';
    if (t.includes('withdraw')) return 'text-accent-blue';
    if (t.includes('new table')) return 'text-accent-yellow';
    if (t.includes('ban')) return 'text-danger-red';
    if (t.includes('setting')) return 'text-accent-blue';
    return '';
  };

  const renderRow = (
    r: AuditLogEntry,
    style: CSSProperties | undefined,
    i: number,
  ) => (
    <li
      key={i}
      style={style}
      className="grid grid-cols-6 border-b border-dark hover:bg-hover-bg"
    >
      <div className="py-3 px-2 text-text-secondary">{r.timestamp}</div>
      <div className="py-3 px-2">{r.admin}</div>
      <div className="py-3 px-2">{r.user}</div>
      <div className={`py-3 px-2 ${actionColor(r.action)}`}>{r.action}</div>
      <div className="py-3 px-2">{r.description}</div>
      <div className="py-3 px-2">
        <StatusPill label={r.status} className={auditStyles[r.status]} />
      </div>
    </li>
  );

  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <section className="bg-card-bg p-6 rounded-2xl card-shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Date Range
            </label>
            <input
              type="date"
              className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
              {...register('date')}
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Action Type
            </label>
            <select
              className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
              {...register('action')}
            >
              <option value="">All Actions</option>
              <option value="add balance">Add Balance</option>
              <option value="remove balance">Remove Balance</option>
              <option value="withdraw">Withdrawal Approval</option>
              <option value="ban">Ban User</option>
              <option value="table">New Table Created</option>
              <option value="setting">Setting Change</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Performed By
            </label>
            <select
              className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
              {...register('performer')}
            >
              <option value="">All</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Affected User
            </label>
            <input
              placeholder="Enter username"
              className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
              {...register('user')}
            />
          </div>
          <div className="flex items-end">
            <button className="w-full bg-accent-blue hover:brightness-110 py-2 rounded-xl font-semibold">
              Apply Filters
            </button>
          </div>
        </div>
      </section>

      {/* Audit table */}
      <section>
        <div className="bg-card-bg p-6 rounded-2xl card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">System Audit Log</h3>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                className="bg-accent-yellow hover:brightness-110 text-black px-4 py-2 rounded-xl font-semibold text-sm"
              >
                Export
              </button>
              <button
                onClick={() => {}}
                className="bg-hover-bg hover:bg-accent-blue px-4 py-2 rounded-xl font-semibold text-sm"
                title="Refresh"
              >
                <FontAwesomeIcon icon={faRotateRight} />
              </button>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-6 border-b border-dark text-text-secondary">
              <button
                className="text-left py-3 px-2 hover:text-accent-yellow"
                onClick={() => toggleSort('timestamp')}
              >
                Timestamp
              </button>
              <button
                className="text-left py-3 px-2 hover:text-accent-yellow"
                onClick={() => toggleSort('admin')}
              >
                Admin
              </button>
              <div className="text-left py-3 px-2">Affected User</div>
              <div className="text-left py-3 px-2">Action Type</div>
              <div className="text-left py-3 px-2">Description</div>
              <div className="text-left py-3 px-2">Status</div>
            </div>
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-text-secondary">
                No results
              </div>
            ) : (
              <VirtualizedList
                items={filtered}
                estimateSize={56}
                className="max-h-96 overflow-auto"
                virtualizationThreshold={20}
                renderItem={renderRow}
              />
            )}
          </div>
        </div>
      </section>

      {/* Admin Activity */}
      <section>
        <div className="bg-card-bg p-6 rounded-2xl card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Admin Activity Overview</h3>
            <button className="bg-accent-blue hover:brightness-110 px-4 py-2 rounded-xl font-semibold text-sm">
              View Full Activity
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark">
                  <th className="text-left py-3 px-2 text-text-secondary">
                    Admin Name
                  </th>
                  <th className="text-left py-3 px-2 text-text-secondary">
                    Last Action
                  </th>
                  <th className="text-left py-3 px-2 text-text-secondary">
                    Total Actions (24h)
                  </th>
                  <th className="text-left py-3 px-2 text-text-secondary">
                    Login History
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-3 px-2 text-text-secondary"
                    >
                      No admin activity
                    </td>
                  </tr>
                ) : (
                  admins.map((a) => (
                    <tr
                      key={a.name}
                      className="border-b border-dark hover:bg-hover-bg cursor-pointer"
                      onClick={() => setValue('performer', a.name.toLowerCase())}
                      title="Filter audit log by this admin"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Image
                            src={a.avatar}
                            alt={a.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-semibold hover:text-accent-yellow">
                            {a.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-text-secondary">
                        {a.lastAction}
                      </td>
                      <td className="py-3 px-2 font-semibold text-accent-green">
                        {a.total24h}
                      </td>
                      <td
                        className="py-3 px-2 text-text-secondary"
                        title={a.loginTitle}
                      >
                        {a.login}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Security Alert Feed — TINTED like HTML, turns solid on resolve */}
      <section>
        <div className="bg-card-bg p-6 rounded-2xl card-shadow">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FontAwesomeIcon
              icon={faShieldHalved}
              className="text-danger-red"
            />
            Security Alert Feed
          </h3>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-text-secondary">No security alerts</p>
            ) : (
              alerts.map((a) => {
              const isDanger = a.severity === 'danger';

              // classes for tinted vs resolved
              const containerCls = [
                'alert-row',
                a.resolved
                  ? 'alert-danger-solid'
                  : isDanger
                    ? 'alert-danger-tint'
                    : 'alert-yellow-tint',
              ].join(' ');

              const titleCls = a.resolved
                ? 'font-semibold'
                : isDanger
                  ? 'alert-title-danger'
                  : 'alert-title-yellow';

              const iconCls = a.resolved
                ? 'text-white'
                : isDanger
                  ? 'text-danger-red'
                  : 'text-accent-yellow';

              return (
                <div key={a.id} className={containerCls}>
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faFlag} className={iconCls} />
                    <div className="flex-1">
                      <p className={titleCls}>{a.title}</p>
                      <p
                        className={`text-sm ${a.resolved ? 'text-white' : 'text-text-secondary'}`}
                      >
                        {a.body}
                      </p>
                      <p
                        className={`text-xs ${a.resolved ? 'text-white' : 'text-text-secondary'}`}
                      >
                        {a.time}
                      </p>
                    </div>

                    {!a.resolved ? (
                      <button
                        onClick={() => markResolved(a.id)}
                        className={
                          isDanger
                            ? 'bg-danger-red hover-glow-red px-3 py-1 rounded text-xs font-semibold transition-colors duration-200'
                            : 'bg-accent-yellow hover-glow-yellow text-black px-3 py-1 rounded text-xs font-semibold transition-colors duration-200'
                        }
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-xs font-semibold">Resolved</span>
                    )}
                  </div>
                </div>
              );
              })
            )}
          </div>
        </div>
      </section>

      {/* Additional Content */}
      <section>
        <div className="bg-card-bg p-6 rounded-2xl card-shadow">
          <h3 className="text-lg font-bold mb-4">Additional Content</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark">
                  <th className="text-left py-3 px-2 text-text-secondary">
                    Title
                  </th>
                  <th className="text-left py-3 px-2 text-text-secondary">
                    Description
                  </th>
                  <th className="text-left py-3 px-2 text-text-secondary">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-dark hover:bg-hover-bg">
                  <td className="py-3 px-2">Event 1</td>
                  <td className="py-3 px-2">Description of Event 1</td>
                  <td className="py-3 px-2">2024-01-15</td>
                </tr>
                <tr className="border-b border-dark hover:bg-hover-bg">
                  <td className="py-3 px-2">Event 2</td>
                  <td className="py-3 px-2">Description of Event 2</td>
                  <td className="py-3 px-2">2024-01-16</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
