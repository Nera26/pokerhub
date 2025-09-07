'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { logger } from '@/lib/logger';
import type { GameFilter, ProfitLossFilter } from '@/types/filters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons/faRightFromBracket';
import ProfileSection from '@/app/components/user/ProfileSection';
import GameStatistics from '@/app/components/user/GameStatistics';
import HistoryTabs from '@/app/components/user/HistoryTabs';
import FilterDropdown from '@/app/components/user/FilterDropdown';
import HistoryList from '@/app/components/user/HistoryList';
import { fetchProfile } from './fetchProfile';
import type { UserProfile } from '@shared/types';
const ReplayModal = dynamic(() => import('@/app/components/user/ReplayModal'), {
  ssr: false,
});
const BracketModal = dynamic(
  () => import('@/app/components/user/BracketModal'),
  { ssr: false },
);
const LogoutModal = dynamic(() => import('@/app/components/user/LogoutModal'), {
  ssr: false,
});
const EditProfileModal = dynamic(
  () => import('@/app/components/user/EditProfileModal'),
  { ssr: false },
);
import ToastNotification from '@/app/components/ui/ToastNotification';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'game-history' | 'tournament-history' | 'transaction-history'
  >('game-history');
  useEffect(() => {
    const controller = new AbortController();
    fetchProfile({ signal: controller.signal })
      .then((data) => setProfile(data))
      .catch((err) => {
        logger.error('Failed to fetch profile', err);
        setError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  const defaultFilters = useMemo(
    () => ({
      gameType: 'any' as GameFilter,
      profitLoss: 'any' as ProfitLossFilter,
      date: '',
    }),
    [],
  );
  const [filters, setFilters] = useState(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const [bracketOpen, setBracketOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bracketTitle, setBracketTitle] = useState('');
  const [toast, setToast] = useState({
    message: '',
    type: 'success',
    isOpen: false,
    duration: 3000,
  });

  const handleSelectTab = useCallback(
    (tab: typeof selectedTab) => setSelectedTab(tab),
    [],
  );

  const handleApplyFilters = useCallback(
    (f: { gameType: GameFilter; profitLoss: ProfitLossFilter; date: string }) =>
      setFilters(f),
    [],
  );
  const handleResetFilters = useCallback(
    () => setFilters(defaultFilters),
    [defaultFilters],
  );

  const toggleFilterOpen = useCallback(() => setFilterOpen((o) => !o), []);

  const openReplay = useCallback(() => setReplayOpen(true), []);
  const closeReplay = useCallback(() => setReplayOpen(false), []);
  const openBracket = useCallback((title: string) => {
    setBracketTitle(title);
    setBracketOpen(true);
  }, []);
  const closeBracket = useCallback(() => setBracketOpen(false), []);
  const openLogout = useCallback(() => setLogoutOpen(true), []);
  const closeLogout = useCallback(() => setLogoutOpen(false), []);
  const openEdit = useCallback(() => setEditOpen(true), []);
  const closeEdit = useCallback(() => setEditOpen(false), []);

  const showToast = useCallback(
    (
      msg: string,
      options: { type?: 'success' | 'error'; duration?: number } = {},
    ) => {
      setToast({
        message: msg,
        type: options.type ?? 'success',
        duration: options.duration ?? 3000,
        isOpen: true,
      });
    },
    [],
  );
  const closeToast = useCallback(
    () => setToast((t) => ({ ...t, isOpen: false })),
    [],
  );

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error || !profile) {
    return <p>Error loading profile</p>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+72px)]">
        <ProfileSection profile={profile} onEdit={openEdit} />

        <GameStatistics onSelectTab={handleSelectTab} />
        <HistoryTabs selected={selectedTab} onChange={handleSelectTab} />

        {selectedTab === 'game-history' && (
          <>
            <div className="relative flex justify-end mb-4">
              <button
                onClick={toggleFilterOpen}
                className="text-accent-blue hover:text-accent-yellow flex items-center"
              >
                <FontAwesomeIcon icon={faFilter} className="mr-1" /> Filter
              </button>

              <FilterDropdown
                open={filterOpen}
                filters={filters}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                // you can pass className="absolute right-0 top-full mt-2" or handle positioning inside FilterDropdown
              />
            </div>

            <HistoryList
              type="game-history"
              filters={filters}
              onWatchReplay={openReplay}
            />
          </>
        )}

        {selectedTab === 'tournament-history' && (
          <HistoryList type="tournament-history" onViewBracket={openBracket} />
        )}

        {selectedTab === 'transaction-history' && (
          <HistoryList type="transaction-history" />
        )}

        {/* Floating Logout Button */}
        <button
          onClick={openLogout}
          className="fixed right-8 bottom-[calc(env(safe-area-inset-bottom)+104px)] bg-danger-red text-white font-bold py-3 px-6 rounded-xl hover-glow-red transition duration-200"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="mr-2" /> Logout
        </button>
      </div>

      <FilterDropdown
        open={filterOpen}
        filters={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        className="hidden"
      />

      <ReplayModal isOpen={replayOpen} onClose={closeReplay} />
      <BracketModal
        isOpen={bracketOpen}
        title={bracketTitle}
        onClose={closeBracket}
      />
      <LogoutModal isOpen={logoutOpen} onClose={closeLogout} />

      <EditProfileModal
        isOpen={editOpen}
        onClose={closeEdit}
        onSave={(data) => {
          logger.info('Saved:', data);
          closeEdit();
          showToast('Profile updated', { type: 'success', duration: 4000 });
        }}
      />

      <ToastNotification
        message={toast.message}
        type={toast.type as 'success' | 'error'}
        isOpen={toast.isOpen}
        duration={toast.duration}
        onClose={closeToast}
      />
    </>
  );
}
