'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons/faArrowsRotate';
import { LeaderboardTabs, LeaderboardBase } from '@/features/leaderboard';
import ToastNotification, {
  ToastType,
} from '@/app/components/ui/ToastNotification';
import { fetchUserProfile } from '@/lib/api/profile';
import { useLeaderboardModes } from '@/lib/api/leaderboard';
import type { LeaderboardEntry, TimeFilter, ModeFilter } from '@shared/types';

export default function LeaderboardPage() {
  const [selectedTime, setSelectedTime] = useState<TimeFilter>('daily');
  const {
    data: modesData,
    isLoading: modesLoading,
    error: modesError,
  } = useLeaderboardModes();
  const modeOptions = modesData?.modes ?? [];
  const [selectedMode, setSelectedMode] = useState<ModeFilter | undefined>();

  useEffect(() => {
    if (!selectedMode && modeOptions.length > 0) {
      setSelectedMode(modeOptions[0]);
    }
  }, [modeOptions, selectedMode]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleRowClick = async (player: LeaderboardEntry) => {
    setToastMessage('Loading profile...');
    setToastType('loading');
    setToastOpen(true);
    try {
      await fetchUserProfile(player.playerId);
      router.push(`/profile/${player.playerId}`);
    } catch {
      setToastMessage('Failed to load profile');
      setToastType('error');
      setToastOpen(true);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)] bg-primary-bg text-text-primary">
        {/* Title */}
        <section className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-text-secondary text-sm sm:text-base">
            See who’s crushing the tables in real time!
          </p>
        </section>

        {/* Filters */}
        <section className="mb-6 bg-card-bg rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-4 sm:space-y-0">
            <LeaderboardTabs
              selected={selectedTime}
              onChange={setSelectedTime}
            />

            <div className="sm:ml-8">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Game Mode:
              </label>
              {modesLoading ? (
                <div>Loading modes...</div>
              ) : modesError ? (
                <div>Error loading modes</div>
              ) : modeOptions.length === 0 ? (
                <div>No modes available</div>
              ) : (
                <div className="flex space-x-2">
                  {modeOptions.map((mode) => {
                    const isActive = mode === selectedMode;
                    const label =
                      mode === 'cash'
                        ? 'Cash Game'
                        : mode.charAt(0).toUpperCase() + mode.slice(1);
                    return (
                      <button
                        key={mode}
                        type="button"
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 hover-glow-yellow ${
                          isActive
                            ? 'bg-accent-yellow text-primary-bg'
                            : 'bg-hover-bg text-text-secondary hover:bg-accent-yellow hover:text-primary-bg'
                        }`}
                        onClick={() => setSelectedMode(mode)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              className="ml-auto flex items-center space-x-2 bg-accent-blue text-primary-bg font-semibold px-4 py-2 rounded-xl hover-glow-green transition-colors duration-200"
              onClick={async () => {
                await queryClient.invalidateQueries({
                  queryKey: ['leaderboard'],
                });
                setToastMessage('🔄 Leaderboard refreshed');
                setToastType('success');
                setToastOpen(true);
              }}
            >
              <FontAwesomeIcon icon={faArrowsRotate} />
              <span>Refresh</span>
            </button>
          </div>
        </section>

        {/* Leaderboard Table */}
        <section className="bg-card-bg rounded-2xl p-6 overflow-x-auto">
          <LeaderboardBase onPlayerClick={handleRowClick} />
        </section>
      </div>

      {/* Toast Notifications */}
      <ToastNotification
        message={toastMessage}
        type={toastType}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}
