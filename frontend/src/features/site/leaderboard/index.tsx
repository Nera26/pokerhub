'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons/faArrowsRotate';
import LeaderboardTabs, {
  TimeFilter,
} from '@/app/components/leaderboard/LeaderboardTabs';
import LeaderboardTable, {
  Player,
  ModeFilter,
} from '@/app/components/leaderboard/LeaderboardTable';
import ToastNotification, {
  ToastType,
} from '@/app/components/ui/ToastNotification';

const initialPlayers: Player[] = [
  {
    id: 1,
    username: 'PokerPro123',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
    winnings: 10540.5,
    gamesPlayed: 152,
    winRate: 68,
    tier: 'Diamond',
    isCurrent: false,
    category: 'daily-cash',
  },
  {
    id: 2,
    username: 'AceHighRoller',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
    winnings: 9870.0,
    gamesPlayed: 120,
    winRate: 65,
    tier: 'Platinum',
    isCurrent: true,
    category: 'daily-cash',
  },
  {
    id: 3,
    username: 'CardShark_77',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
    winnings: 8220.75,
    gamesPlayed: 180,
    winRate: 55,
    tier: 'Gold',
    isCurrent: false,
    category: 'daily-cash',
  },
  {
    id: 4,
    username: 'RiverRatKing',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
    winnings: 7500.0,
    gamesPlayed: 210,
    winRate: 51,
    tier: 'Gold',
    isCurrent: false,
    category: 'daily-cash',
  },
  {
    id: 5,
    username: 'LadyLuck',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
    winnings: 6950.2,
    gamesPlayed: 130,
    winRate: 49,
    tier: 'Silver',
    isCurrent: false,
    category: 'daily-cash',
  },
  {
    id: 6,
    username: 'BigBlindsBet',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg',
    winnings: 6200.1,
    gamesPlayed: 95,
    winRate: 47,
    tier: 'Bronze',
    isCurrent: false,
    category: 'daily-cash',
  },
  {
    id: 7,
    username: 'ChipCommander',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg',
    winnings: 5700.0,
    gamesPlayed: 80,
    winRate: 44,
    tier: 'Bronze',
    isCurrent: false,
    category: 'daily-cash',
  },
  {
    id: 8,
    username: 'FlushMaster',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg',
    winnings: 15020.5,
    gamesPlayed: 200,
    winRate: 72,
    tier: 'Diamond',
    isCurrent: false,
    category: 'weekly-cash',
  },
  {
    id: 9,
    username: 'RiverRatKing',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
    winnings: 14200.0,
    gamesPlayed: 180,
    winRate: 70,
    tier: 'Diamond',
    isCurrent: false,
    category: 'weekly-cash',
  },
  {
    id: 10,
    username: 'AceHighRoller',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
    winnings: 13000.0,
    gamesPlayed: 160,
    winRate: 68,
    tier: 'Platinum',
    isCurrent: true,
    category: 'weekly-cash',
  },
  {
    id: 11,
    username: 'CardShark_77',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
    winnings: 12000.0,
    gamesPlayed: 150,
    winRate: 65,
    tier: 'Gold',
    isCurrent: false,
    category: 'weekly-cash',
  },
  {
    id: 12,
    username: 'LadyLuck',
    avatar:
      'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
    winnings: 11500.0,
    gamesPlayed: 140,
    winRate: 63,
    tier: 'Gold',
    isCurrent: false,
    category: 'weekly-cash',
  },
  // ...add monthly and tournament entries as needed
];

export default function LeaderboardPage() {
  const [selectedTime, setSelectedTime] = useState<TimeFilter>('daily');
  const [selectedMode, setSelectedMode] = useState<ModeFilter>('cash');
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // Example: show a toast when user clicks top row (could also be handled in Table component)
  const handleRowClick = (player: Player) => {
    setToastMessage(`👋 You clicked on ${player.username}`);
    setToastType('success');
    setToastOpen(true);
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
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 hover-glow-yellow ${
                    selectedMode === 'cash'
                      ? 'bg-accent-yellow text-primary-bg'
                      : 'bg-hover-bg text-text-secondary hover:bg-accent-yellow hover:text-primary-bg'
                  }`}
                  onClick={() => setSelectedMode('cash')}
                >
                  Cash Game
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 hover-glow-yellow ${
                    selectedMode === 'tournament'
                      ? 'bg-accent-yellow text-primary-bg'
                      : 'bg-hover-bg text-text-secondary hover:bg-accent-yellow hover:text-primary-bg'
                  }`}
                  onClick={() => setSelectedMode('tournament')}
                >
                  Tournament
                </button>
              </div>
            </div>

            <button
              className="ml-auto flex items-center space-x-2 bg-accent-blue text-primary-bg font-semibold px-4 py-2 rounded-xl hover-glow-green transition-colors duration-200"
              onClick={() => {
                /* Could trigger a data refresh */
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
          <LeaderboardTable
            data={initialPlayers}
            selectedTime={selectedTime}
            selectedMode={selectedMode}
            onPlayerClick={handleRowClick}
          />
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
