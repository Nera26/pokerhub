'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProfileSection from '../components/user/ProfileSection';
import GameStatistics from '../components/user/GameStatistics';
import HistoryTabs from '../components/user/HistoryTabs';
import HistoryList from '../components/user/HistoryList';
import EditProfileModal from '../components/user/EditProfileModal';
import LogoutModal from '../components/user/LogoutModal';
import BracketModal from '../components/user/BracketModal';
import { Button } from '../components/ui/Button';
import { fetchProfile, fetchStats, updateProfile } from '@/lib/api/profile';
import type { ProfileStatsResponse, UserProfile } from '@shared/types';

export default function UserPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    'game-history' | 'tournament-history' | 'transaction-history'
  >('game-history');
  const [isEditOpen, setEditOpen] = useState(false);
  const [isLogoutOpen, setLogoutOpen] = useState(false);
  const [bracketTitle, setBracketTitle] = useState<string | null>(null);

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
      <HistoryList
        type={activeTab}
        onViewBracket={(title) => setBracketTitle(title)}
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
      <LogoutModal isOpen={isLogoutOpen} onClose={() => setLogoutOpen(false)} />
      <BracketModal
        isOpen={bracketTitle !== null}
        title={bracketTitle ?? ''}
        onClose={() => setBracketTitle(null)}
      />
    </div>
  );
}
