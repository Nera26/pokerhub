// src/app/dashboard/page.tsx
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
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

import { fetchAdminTabs, fetchAdminTabMeta } from '@/lib/api/admin';
import type { SidebarTab } from '@shared/types';
const Sidebar = dynamic(() => import('@/app/components/dashboard/Sidebar'), {
  loading: () => <div>Loading sidebar...</div>,
});
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import DashboardModule from '@/app/components/dashboard/DashboardModule';
import { getSiteMetadata } from '@/lib/metadata';

function isSidebarTab(v: string | null, tabs: SidebarTab[]): v is SidebarTab {
  return !!v && tabs.includes(v as SidebarTab);
}

function TabFallback({ tab, online }: { tab: SidebarTab; online?: number }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-tab-meta', tab],
    queryFn: ({ signal }) => fetchAdminTabMeta(tab, { signal }),
  });

  if (isLoading) {
    return <div>Loading {tab}...</div>;
  }

  if (isError || !data || !data.enabled) {
    const title = data?.title ?? tab;
    const message =
      data?.message ??
      (error instanceof Error ? error.message : 'This section is coming soon.');
    return (
      <div className="bg-card-bg rounded-2xl p-8 card-shadow">
        <h3 className="text-xl font-semibold mb-2 capitalize">{title}</h3>
        <p className="text-text-secondary">{message}</p>
      </div>
    );
  }

  return (
    <DashboardModule
      loader={() => import(/* @vite-ignore */ data.component)}
      loading={<div>Loading {data.title.toLowerCase()}...</div>}
      error={<div>Error loading {data.title.toLowerCase()}.</div>}
      {...(tab === 'broadcast' ? { props: { online: online ?? 0 } } : {})}
    />
  );
}

function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const {
    data: tabsData,
    isLoading: tabsLoading,
    isError: tabsError,
    error: tabsFetchError,
  } = useQuery({
    queryKey: ['admin-tabs'],
    queryFn: ({ signal }) => fetchAdminTabs({ signal }),
  });

  const tabItems = tabsData ?? [];
  const tabs = tabItems.map((t) => t.id) as SidebarTab[];
  const titles = useMemo(
    () =>
      Object.fromEntries(tabItems.map((t) => [t.id, t.title])) as Record<
        SidebarTab,
        string
      >,
    [tabItems],
  );
  const tabConfig = useMemo(
    () =>
      Object.fromEntries(
        tabItems.map((t) => [
          t.id,
          {
            loader: () => import(/* @vite-ignore */ t.component),
            loading: <div>Loading {t.title.toLowerCase()}...</div>,
            error: <div>Error loading {t.title.toLowerCase()}.</div>,
          },
        ]),
      ) as Record<
        SidebarTab,
        {
          loader: () => Promise<{ default: ComponentType<object> }>;
          loading: ReactNode;
          error: ReactNode;
        }
      >,
    [tabItems],
  );

  const [tab, setTab] = useState<SidebarTab>(
    () => (search.get('tab') as SidebarTab) || 'dashboard',
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl);
  const { data: meta } = useQuery({
    queryKey: ['site-metadata'],
    queryFn: getSiteMetadata,
  });
  const {
    data: metrics,
    error: metricsError,
    isLoading: metricsLoading,
  } = useDashboardMetrics();

  const { data: tabMeta } = useQuery({
    queryKey: ['admin-tab-meta', tab],
    queryFn: ({ signal }) => fetchAdminTabMeta(tab, { signal }),
    enabled: !tabConfig[tab],
  });

  useEffect(() => {
    if (!tabs.length) return;
    const q = search.get('tab');
    if (q) {
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

  const title = titles[tab] ?? tabMeta?.title ?? 'Admin Dashboard';

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
          {tabsFetchError instanceof Error
            ? tabsFetchError.message
            : 'Error loading tabs.'}
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
              src={
                avatarUrl ??
                meta?.defaultAvatar ??
                'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
              }
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
          {tabConfig[tab] ? (
            <DashboardModule
              loader={tabConfig[tab].loader}
              loading={tabConfig[tab].loading}
              error={tabConfig[tab].error}
              {...(tab === 'broadcast'
                ? { props: { online: metrics?.online ?? 0 } }
                : {})}
            />
          ) : (
            <TabFallback tab={tab} online={metrics?.online} />
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
