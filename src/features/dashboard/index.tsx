// src/app/dashboard/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import type { ReactNode, ComponentType } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCoins, faBars } from '@fortawesome/free-solid-svg-icons';

import useRenderCount from '@/hooks/useRenderCount';
import type { SidebarTab } from '@/app/components/dashboard/Sidebar';
const Sidebar = dynamic(() => import('@/app/components/dashboard/Sidebar'), {
  loading: () => <div>Loading sidebar...</div>,
});
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import DashboardModule from '@/app/components/dashboard/DashboardModule';
const ALL_TABS: SidebarTab[] = [
  'dashboard',
  'users',
  'balance',
  'audit',
  'tables',
  'tournaments',
  'bonus',
  'broadcast',
  'messages',
  'analytics',
];

const titleMap: Partial<Record<SidebarTab, string>> = {
  messages: 'Messages',
  audit: 'Audit Logs',
  users: 'Manage Users',
  balance: 'Balance & Transactions',
  tables: 'Manage Tables',
  tournaments: 'Manage Tournaments',
  bonus: 'Bonus Manager',
  broadcast: 'Broadcast Tool',
  analytics: 'Analytics',
};

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
};

function isSidebarTab(v: string | null): v is SidebarTab {
  return !!v && (ALL_TABS as string[]).includes(v);
}

function DashboardPage() {
  useRenderCount('DashboardPage');
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [tab, setTab] = useState<SidebarTab>(() => {
    const q = search.get('tab');
    return isSidebarTab(q) ? (q as SidebarTab) : 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    data: metrics,
    error: metricsError,
    isLoading: metricsLoading,
  } = useDashboardMetrics();

  // Keep ?tab=<id> in the URL in sync with state
  useEffect(() => {
    const qs = new URLSearchParams(search.toString());
    if (qs.get('tab') !== tab) {
      qs.set('tab', tab);
      router.replace(`${pathname}?${qs.toString()}`);
    }
  }, [tab, router, pathname, search]);

  const title = titleMap[tab] ?? 'Admin Dashboard';

  return (
    <div className="min-h-screen bg-primary-bg text-primary">
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
            <div className="flex items-center gap-2 bg-primary-bg px-3 py-2 rounded-xl">
              <FontAwesomeIcon icon={faUsers} className="text-accent-green" />
              {metricsLoading ? (
                <span className="font-semibold">...</span>
              ) : metricsError ? (
                <span className="font-semibold text-red-500">Error</span>
              ) : (
                <span className="font-semibold">
                  {metrics?.online ?? 0} Online
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-primary-bg px-3 py-2 rounded-xl">
              <FontAwesomeIcon icon={faCoins} className="text-accent-yellow" />
              {metricsLoading ? (
                <span className="font-semibold">...</span>
              ) : metricsError ? (
                <span className="font-semibold text-red-500">Error</span>
              ) : (
                <span className="font-semibold">
                  {`$${metrics?.revenue.toLocaleString() ?? '0'}`}
                </span>
              )}
            </div>
            <Image
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
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
              <p className="text-secondary">This section is coming soon.</p>
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
