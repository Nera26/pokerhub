'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProfileSection from '../components/user/ProfileSection';
import GameStatistics from '../components/user/GameStatistics';
import HistoryTabs from '../components/user/HistoryTabs';
import HistoryList from '../components/user/HistoryList';
import FilterDropdown from '../components/user/FilterDropdown';
import EditProfileModal from '../components/user/EditProfileModal';
import LogoutModal from '../components/user/LogoutModal';
import ReplayModal from '../components/user/ReplayModal';
import BracketModal from '../components/user/BracketModal';
import { Button } from '../components/ui/Button';
import { fetchProfile, fetchStats, updateProfile } from '@/lib/api/profile';
import type { GameFilter, ProfitLossFilter } from '@/types/filters';
import type { ProfileStatsResponse, UserProfile } from '@shared/types';

export default function UserPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    'game-history' | 'tournament-history' | 'transaction-history'
  >('game-history');
  const [filters, setFilters] = useState<{
    gameType: GameFilter;
    profitLoss: ProfitLossFilter;
    date: string;
  }>({
    gameType: 'any',
    profitLoss: 'any',
    date: '',
  });
  const [isEditOpen, setEditOpen] = useState(false);
  const [isLogoutOpen, setLogoutOpen] = useState(false);

  // Modals for extra actions
  const [bracketTitle, setBracketTitle] = useState<string | null>(null);
  const [replayHandId, setReplayHandId] = useState<string | null>(null);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: ({ signal }) => fetchProfile({ signal }),
  });

  const { data: stats } = useQuery<ProfileStatsResponse>({
    queryKey: ['profileStats'],
    queryFn: ({ signal }) => fetchStats({ signal }),
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditOpen(false);
    },
  });

  if (!profile || !stats) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <ProfileSection profile={profile} onEdit={() => setEditOpen(true)} />
      <GameStatistics stats={stats} onSelectTab={setActiveTab} />
      <HistoryTabs
        selected={activeTab}
        onChange={(t) => setActiveTab(t as any)}
      />

      <FilterDropdown filters={filters} onChange={setFilters} />

      <HistoryList
        type={activeTab}
        filters={filters}
        onViewBracket={(title) => setBracketTitle(title)}
        onWatchReplay={(id) => setReplayHandId(id)}
      />

      <div className="flex justify-end">
        <Button variant="danger" onClick={() => setLogoutOpen(true)}>
          Logout
        </Button>
      </div>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        onSave={(data) => updateMutation.mutate(data)}
      />

      <ReplayModal
        isOpen={replayHandId !== null}
        handId={replayHandId ?? ''}
        onClose={() => setReplayHandId(null)}
      />

      <BracketModal
        isOpen={bracketTitle !== null}
        title={bracketTitle ?? ''}
        onClose={() => setBracketTitle(null)}
      />

      <LogoutModal isOpen={isLogoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  );
}
