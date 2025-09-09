'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faDollarSign,
  faTableCells,
  faTrophy,
  faArrowDown,
  faArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useRevenueBreakdown } from '@/hooks/useRevenueBreakdown';
import MetricCard, { TimeFilter } from './MetricCard';
import BroadcastPanel from './BroadcastPanel';
import DashboardTransactionHistory from './transactions/TransactionHistory';

const ActivityChart = dynamic(() => import('./charts/ActivityChart'), {
  loading: () => (
    <div className="h-64 flex items-center justify-center text-text-secondary">
      Loading chart...
    </div>
  ),
  ssr: false,
});

const RevenueDonut = dynamic(() => import('./charts/RevenueDonut'), {
  loading: () => (
    <div className="h-64 flex items-center justify-center text-text-secondary">
      Loading chart...
    </div>
  ),
  ssr: false,
});

// ---------- Small UI helpers ----------
function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card-bg p-6 rounded-2xl card-shadow ${className}`}>
      {title ? <h3 className="text-lg font-bold mb-4">{title}</h3> : null}
      {children}
    </div>
  );
}

function PillBtn({
  children,
  color,
  onClick,
}: {
  children: React.ReactNode;
  color: 'blue' | 'red' | 'green' | 'yellow';
  onClick?: () => void;
}) {
  const map = {
    blue: 'bg-info hover:brightness-110 text-white',
    red: 'bg-danger hover:brightness-110 text-white',
    green: 'bg-success hover:brightness-110 text-white',
    yellow: 'bg-accent hover:brightness-110 text-black',
  } as const;
  return (
    <button
      onClick={onClick}
      className={`${map[color]} px-3 py-1 rounded text-xs font-semibold`}
    >
      {children}
    </button>
  );
}

// ---------- Content-only Dashboard ----------
export default function Dashboard() {
  const [revFilter, setRevFilter] = useState<TimeFilter>('today');
  const [depFilter, setDepFilter] = useState<TimeFilter>('today');
  const [wdFilter, setWdFilter] = useState<TimeFilter>('today');
  const { data, isLoading, error } = useDashboardMetrics();
  const metrics = (data ?? {}) as any;
  const {
    data: revenueStreams = [],
    isLoading: revLoading,
    error: revError,
  } = useRevenueBreakdown(revFilter);

  const formatCurrency = (v: number | undefined) =>
    `$${(v ?? 0).toLocaleString()}`;

  if (isLoading || revLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  if (error || revError) {
    return (
      <div className="h-64 flex items-center justify-center text-danger-red">
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Active Users</p>
              <p className="text-2xl font-bold text-accent-green">
                {metrics.online ?? 0}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faUsers}
              className="text-3xl text-accent-green"
            />
          </div>
        </Card>

        <MetricCard
          title="Revenue"
          value={formatCurrency(metrics.revenue?.[revFilter]?.amount)}
          icon={faDollarSign}
          valueClassName="text-accent-yellow"
          subtext={metrics.revenue?.[revFilter]?.trend ?? ''}
          filter={{ value: revFilter, onChange: setRevFilter }}
        />

        <MetricCard
          className="cursor-pointer hover:bg-hover-bg transition-colors"
          title="Open Tables"
          value={metrics.tables?.open ?? metrics.tables ?? 0}
          icon={faTableCells}
          valueClassName="text-accent-blue"
          iconClassName="text-accent-blue"
          subtext={
            metrics.tables?.full !== undefined
              ? `${metrics.tables.full} full`
              : undefined
          }
          subtextClassName="text-text-secondary"
        />

        <MetricCard
          className="cursor-pointer hover:bg-hover-bg transition-colors"
          title="Tournaments"
          value={metrics.tournaments?.total ?? metrics.tournaments ?? 0}
          icon={faTrophy}
          iconClassName="text-accent-yellow"
          subtext={
            metrics.tournaments?.running !== undefined
              ? `${metrics.tournaments.running} running`
              : undefined
          }
          subtextClassName="text-text-secondary"
        />

        <MetricCard
          className="cursor-pointer hover:bg-hover-bg transition-colors"
          title="Deposits"
          value={formatCurrency(metrics.deposits?.[depFilter]?.amount)}
          icon={faArrowDown}
          valueClassName="text-accent-green"
          iconClassName="text-accent-green"
          subtext={metrics.deposits?.[depFilter]?.trend ?? ''}
          filter={{ value: depFilter, onChange: setDepFilter }}
        />

        <MetricCard
          className="cursor-pointer hover:bg-hover-bg transition-colors"
          title="Withdrawals"
          value={formatCurrency(metrics.withdrawals?.[wdFilter]?.amount)}
          icon={faArrowUp}
          valueClassName="text-danger-red"
          iconClassName="text-danger-red"
          subtext={metrics.withdrawals?.[wdFilter]?.trend ?? ''}
          filter={{ value: wdFilter, onChange: setWdFilter }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Player Activity (24h)">
          <ActivityChart data={metrics.activity?.[revFilter] ?? []} />
        </Card>
        <Card title="Revenue Breakdown">
          <RevenueDonut streams={revenueStreams} />
        </Card>
      </div>

      {/* Lower panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card title="User Management">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary-bg rounded-xl">
              <div className="flex items-center gap-3">
                <Image
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                  alt="Mike"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold">Mike_P</p>
                  <p className="text-sm font-bold">$2,847</p>
                </div>
              </div>
              <div className="flex gap-2">
                <PillBtn color="blue">Edit</PillBtn>
                <PillBtn color="red">Ban</PillBtn>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary-bg rounded-xl">
              <div className="flex items-center gap-3">
                <Image
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
                  alt="Sarah"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold">Sarah_K</p>
                  <p className="text-sm font-bold">$1,420</p>
                </div>
              </div>
              <div className="flex gap-2">
                <PillBtn color="blue">Edit</PillBtn>
                <PillBtn color="red">Ban</PillBtn>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 bg-accent-green hover:brightness-110 py-2 rounded-xl font-semibold">
            View All Users
          </button>
        </Card>

        {/* Active Tables */}
        <Card title="Active Tables">
          <div className="space-y-3">
            <div className="p-3 bg-primary-bg rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Table #45821</span>
                <span className="text-accent-green text-sm font-bold">9/9</span>
              </div>
              <p className="text-sm text-text-secondary mb-2">
                NL Hold'em • $1/$2
              </p>
              <div className="flex gap-2">
                <PillBtn color="blue">Config</PillBtn>
                <PillBtn color="red">Close</PillBtn>
              </div>
            </div>
            <div className="p-3 bg-primary-bg rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Table #45822</span>
                <span className="text-accent-yellow text-sm font-bold">
                  6/9
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-2">
                NL Hold'em • $2/$5
              </p>
              <div className="flex gap-2">
                <PillBtn color="blue">Config</PillBtn>
                <PillBtn color="red">Close</PillBtn>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 bg-accent-green hover:brightness-110 py-2 rounded-xl font-semibold">
            Create New Table
          </button>
        </Card>

        {/* Messages & Broadcast */}
        <Card title="Messages &amp; Broadcast">
          <BroadcastPanel />
        </Card>
      </div>

      {/* Transaction Log */}
      <Card title="Deposit &amp; Withdrawal Log">
        <DashboardTransactionHistory onExport={() => {}} />
      </Card>
    </div>
  );
}
