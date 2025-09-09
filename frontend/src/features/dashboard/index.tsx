// src/app/dashboard/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import type { ReactNode, ComponentType } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCoins, faBars } from '@fortawesome/free-solid-svg-icons';
import MetricCard from '@/app/components/dashboard/MetricCard';
import { useAuthStore } from '@/app/store/authStore';
import { fetchProfile } from '@/lib/api/profile';
import { useQuery } from '@tanstack/react-query';

import { fetchAdminTabs } from '@/lib/api/admin';
import type { SidebarTab } from '@shared/types';
const Sidebar = dynamic(() => import('@/app/components/dashboard/Sidebar'), {
  loading: () => <div>Loading sidebar...</div>,
});
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import DashboardModule from '@/app/components/dashboard/DashboardModule';
const DEFAULT_AVATAR =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

const TAB_CONFIG: Record<
  SidebarTab,
  {
    loader: () => Promise<{ default: ComponentType<object> }>;
    loading: ReactNode;
    error: ReactNode;
  }
> = {
  dashboard: {
    loader: () => import('@/app/components/dashboard/Dashboard'),
    loading: <div>Loading dashboard...</div>,
    error: <div>Error loading dashboard.</div>,
  },
  users: {
    loader: () => import('@/app/components/dashboard/UserManager'),
    loading: <div>Loading users...</div>,
    error: <div>Error loading users.</div>,
  },
  balance: {
    loader: () => import('@/app/components/dashboard/BalanceTransactions'),
    loading: <div>Loading balance...</div>,
    error: <div>Error loading balance.</div>,
  },
  audit: {
    loader: () => import('@/app/components/dashboard/AuditLogs'),
    loading: <div>Loading audit logs...</div>,
    error: <div>Error loading audit logs.</div>,
  },
  tables: {
    loader: () => import('@/app/components/dashboard/ManageTables'),
    loading: <div>Loading tables...</div>,
    error: <div>Error loading tables.</div>,
  },
  tournaments: {
    loader: () => import('@/app/components/dashboard/ManageTournaments'),
    loading: <div>Loading tournaments...</div>,
    error: <div>Error loading tournaments.</div>,
  },
  ctas: {
    loader: () => import('@/app/components/dashboard/CTAForm'),
    loading: <div>Loading CTAs...</div>,
    error: <div>Error loading CTAs.</div>,
  },
  bonus: {
    loader: () => import('@/app/components/dashboard/BonusManager'),
    loading: <div>Loading bonuses...</div>,
    error: <div>Error loading bonuses.</div>,
  },
  broadcast: {
    loader: () => import('@/app/components/dashboard/Broadcast'),
    loading: <div>Loading broadcast...</div>,
    error: <div>Error loading broadcast.</div>,
  },
  messages: {
    loader: () => import('@/app/components/dashboard/Messages'),
    loading: <div>Loading messages...</div>,
    error: <div>Error loading messages.</div>,
  },
  analytics: {
    loader: () => import('@/app/components/dashboard/analytics/Analytics'),
    loading: <div>Loading analytics...</div>,
    error: <div>Error loading analytics.</div>,
  },
  review: {
    loader: () => import('@/features/collusion'),
    loading: <div>Loading review...</div>,
    error: <div>Error loading review.</div>,
  },
};

function isSidebarTab(v: string | null, tabs: SidebarTab[]): v is SidebarTab {
  return !!v && tabs.includes(v as SidebarTab);
}

function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const {
    data: tabsData,
    isLoading: tabsLoading,
    isError: tabsError,
  } = useQuery({
    queryKey: ['admin-tabs'],
    queryFn: ({ signal }) => fetchAdminTabs({ signal }),
  });

  const tabs = tabsData?.tabs ?? [];
  const titles = tabsData?.titles ?? {};

  const [tab, setTab] = useState<SidebarTab>(
    () => (search.get('tab') as SidebarTab) || 'dashboard',
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl);
  const {
    data: metrics,
    error: metricsError,
    isLoading: metricsLoading,
  } = useDashboardMetrics();

  useEffect(() => {
    if (!tabs.length) return;
    const q = search.get('tab');
    if (isSidebarTab(q, tabs)) {
      setTab(q as SidebarTab);
    } else {
      setTab('dashboard');
    }
  }, [tabs, search]);

  // Keep ?tab=<id> in the URL in sync with state
  useEffect(() => {
    if (!tabs.length) return;
    const qs = new URLSearchParams(search.toString());
    if (qs.get('tab') !== tab) {
      qs.set('tab', tab);
      router.replace(`${pathname}?${qs.toString()}`);
    }
  }, [tab, router, pathname, search, tabs]);

  const title = titles[tab] ?? 'Admin Dashboard';

  useEffect(() => {
    if (avatarUrl === null) {
      const controller = new AbortController();
      fetchProfile({ signal: controller.signal })
        .then((p) => setAvatarUrl(p.avatarUrl || null))
        .catch(() => setAvatarUrl(null));
      return () => controller.abort();
    }
  }, [avatarUrl, setAvatarUrl]);
  if (tabsLoading) {
    return <div>Loading tabs...</div>;
  }

  if (!tabsError && tabs.length === 0) {
    return <div>No tabs available.</div>;
  }

  return (
    <div className="min-h-screen bg-primary-bg text-text-primary">
      {tabsError && (
        <div role="alert" className="text-red-500 p-4">
          Error loading tabs.
        </div>
      )}
      {/* Header */}
      <header className="bg-card-bg border-b border-dark p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto sm:justify-end">
            <MetricCard
              icon={faUsers}
              label="Online"
              value={metrics?.online ?? 0}
              loading={metricsLoading}
              error={metricsError}
            />
            <MetricCard
              icon={faCoins}
              label="Revenue"
              value={`$${metrics?.revenue.toLocaleString() ?? '0'}`}
              loading={metricsLoading}
              error={metricsError}
            />
            <Image
              src={avatarUrl || DEFAULT_AVATAR}
              alt="Admin avatar"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
              loading="lazy"
              sizes="40px"
            />
          </div>
        </div>
      </header>

      {/* Layout */}
      <main
        id="main-content"
        className="flex-1 md:flex md:h-[calc(100vh-80px)]"
      >
        <Sidebar
          active={tab}
          onChange={setTab}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        <section className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-auto">
          {TAB_CONFIG[tab] ? (
            <DashboardModule
              loader={TAB_CONFIG[tab].loader}
              loading={TAB_CONFIG[tab].loading}
              error={TAB_CONFIG[tab].error}
              {...(tab === 'broadcast'
                ? { props: { online: metrics?.online ?? 0 } }
                : {})}
            />
          ) : (
            <div className="bg-card-bg rounded-2xl p-8 card-shadow">
              <h3 className="text-xl font-semibold mb-2 capitalize">{tab}</h3>
              <p className="text-text-secondary">
                This section is coming soon.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardPage />
    </Suspense>
  );
}
