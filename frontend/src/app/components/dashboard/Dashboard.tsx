'use client';

import Image from 'next/image';
import {
  faUsers,
  faDollarSign,
  faTableCells,
  faTrophy,
  faArrowDown,
  faArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useAuthToken } from '@/app/store/authStore';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useRevenueBreakdown } from '@/hooks/useRevenueBreakdown';
import { useDashboardUsers } from '@/hooks/useDashboardUsers';
import { useActiveTables } from '@/hooks/useActiveTables';
import { useActivity } from '@/hooks/useActivity';
import { fetchProfile } from '@/lib/api/profile';
import MetricCard from './MetricCard';
import BroadcastPanel from './BroadcastPanel';
import Messages from './Messages';
import AdminEvents from './AdminEvents';
import DashboardTransactionHistory from './transactions/TransactionHistory';
import WalletReconcileMismatches from './WalletReconcileMismatches';
import FeatureFlagsPanel from './FeatureFlagsPanel';
import CenteredMessage from '@/components/CenteredMessage';
import { Card, CardTitle, CardContent } from '@/app/components/ui/Card';
import Analytics from './analytics/Analytics';
import { ThemeColor, themeColorMap } from '@/app/components/ui/colors';

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
function PillBtn({
  children,
  color,
  onClick,
}: {
  children: React.ReactNode;
  color: ThemeColor;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${themeColorMap[color]} px-3 py-1 rounded text-xs font-semibold`}
    >
      {children}
    </button>
  );
}

// ---------- Content-only Dashboard ----------
export default function Dashboard() {
  const { data, isLoading, error } = useDashboardMetrics();
  const metrics = (data ?? {}) as any;
  const {
    data: revenueStreams = [],
    isLoading: revLoading,
    error: revError,
  } = useRevenueBreakdown('today');
  const {
    data: recentUsers = [],
    isLoading: usersLoading,
    error: usersError,
  } = useDashboardUsers();
  const {
    data: activeTables = [],
    isLoading: tablesLoading,
    error: tablesError,
  } = useActiveTables();
  const {
    data: activity,
    isLoading: activityLoading,
    error: activityError,
  } = useActivity();

  const [profileAvatarUrl, setProfileAvatarUrl] = useState<
    string | undefined
  >();
  const [profileAvatarError, setProfileAvatarError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile({ signal: controller.signal })
      .then((p) => setProfileAvatarUrl(p.avatarUrl))
      .catch(() => setProfileAvatarError(true));
    return () => controller.abort();
  }, []);

  const resolveAvatar = (avatarKey?: string) => {
    if (avatarKey) return avatarKey;
    if (profileAvatarError) return undefined;
    return profileAvatarUrl;
  };

  const token = useAuthToken();
  const isAdmin = useMemo(() => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      return payload.role === 'admin';
    } catch {
      return false;
    }
  }, [token]);

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
        <MetricCard
          icon={faUsers}
          label="Active Users"
          value={
            <span className="text-accent-green">{metrics.online ?? 0}</span>
          }
        />
        <MetricCard
          icon={faDollarSign}
          label="Revenue"
          value={
            <span className="text-accent-yellow">
              {formatCurrency(metrics.revenue?.today?.amount)}
            </span>
          }
        />
        <MetricCard
          icon={faTableCells}
          label="Open Tables"
          value={
            <span className="text-accent-blue">
              {metrics.tables?.open ?? metrics.tables ?? 0}
            </span>
          }
        />
        <MetricCard
          icon={faTrophy}
          label="Tournaments"
          value={metrics.tournaments?.total ?? metrics.tournaments ?? 0}
        />
        <MetricCard
          icon={faArrowDown}
          label="Deposits"
          value={
            <span className="text-accent-green">
              {formatCurrency(metrics.deposits?.today?.amount)}
            </span>
          }
        />
        <MetricCard
          icon={faArrowUp}
          label="Withdrawals"
          value={
            <span className="text-danger-red">
              {formatCurrency(metrics.withdrawals?.today?.amount)}
            </span>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0">
          <CardContent>
            <CardTitle className="text-lg mb-4">
              Player Activity (24h)
            </CardTitle>
            {activityLoading ? (
              <CenteredMessage>Loading activity...</CenteredMessage>
            ) : activityError ? (
              <CenteredMessage>Failed to load activity</CenteredMessage>
            ) : (
              <ActivityChart labels={activity?.labels} data={activity?.data} />
            )}
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardContent>
            <CardTitle className="text-lg mb-4">Revenue Breakdown</CardTitle>
            <RevenueDonut streams={revenueStreams} />
          </CardContent>
        </Card>
      </div>

      {/* Lower panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card className="border-0">
          <CardContent>
            <CardTitle className="text-lg mb-4">User Management</CardTitle>
            {usersLoading ? (
              <div>Loading users...</div>
            ) : usersError ? (
              <div>Failed to load users</div>
            ) : recentUsers.length === 0 ? (
              <div>No users found</div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u) => {
                  const avatarSrc = resolveAvatar(u.avatarKey);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 bg-primary-bg rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        {avatarSrc ? (
                          <Image
                            src={avatarSrc}
                            alt={u.username}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full bg-primary-bg"
                            aria-label={`${u.username} avatar`}
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold">{u.username}</p>
                          <p className="text-sm font-bold">
                            ${u.balance?.toLocaleString() ?? 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <PillBtn color={ThemeColor.Blue}>Edit</PillBtn>
                        <PillBtn color={ThemeColor.Red}>Ban</PillBtn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="w-full mt-4 bg-accent-green hover:brightness-110 py-2 rounded-xl font-semibold">
              View All Users
            </button>
          </CardContent>
        </Card>

        {/* Active Tables */}
        <Card className="border-0">
          <CardContent>
            <CardTitle className="text-lg mb-4">Active Tables</CardTitle>
            {tablesLoading ? (
              <div>Loading tables...</div>
            ) : tablesError ? (
              <div>Failed to load tables</div>
            ) : activeTables.length === 0 ? (
              <div>No active tables</div>
            ) : (
              <div className="space-y-3">
                {activeTables.map((t) => (
                  <div key={t.id} className="p-3 bg-primary-bg rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{t.tableName}</span>
                      <span className="text-accent-green text-sm font-bold">
                        {t.players.current}/{t.players.max}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">
                      {`${t.gameType} • $${t.stakes.small}/${t.stakes.big}`}
                    </p>
                    <div className="flex gap-2">
                      <PillBtn color={ThemeColor.Blue}>Config</PillBtn>
                      <PillBtn color={ThemeColor.Red}>Close</PillBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="w-full mt-4 bg-accent-green hover:brightness-110 py-2 rounded-xl font-semibold">
              Create New Table
            </button>
          </CardContent>
        </Card>

        {/* Messages & Broadcast */}
        <Card className="border-0">
          <CardContent>
            <CardTitle className="text-lg mb-4">
              Messages &amp; Broadcast
            </CardTitle>
            <div
              className={`grid grid-cols-1 ${
                isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
              } gap-6`}
            >
              <Messages />
              <BroadcastPanel />
              {isAdmin && <AdminEvents />}
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="border-0">
            <CardContent>
              <CardTitle className="text-lg mb-4">Feature Flags</CardTitle>
              <FeatureFlagsPanel />
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card className="border-0">
            <CardContent>
              <CardTitle className="text-lg mb-4">
                Wallet Reconcile Mismatches
              </CardTitle>
              <WalletReconcileMismatches />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction Log */}
      <Card className="border-0">
        <CardContent>
          <CardTitle className="text-lg mb-4">
            Deposit &amp; Withdrawal Log
          </CardTitle>
          <DashboardTransactionHistory onExport={() => {}} />
        </CardContent>
      </Card>

      {isAdmin && <Analytics />}
    </div>
  );
}
