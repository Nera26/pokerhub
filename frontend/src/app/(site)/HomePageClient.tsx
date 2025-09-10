'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TopCTAs, GameTabs, HomeLoadingSkeleton } from '../components/home';
import {
  useTables,
  useTournaments,
  type Tournament,
} from '@/hooks/useLobbyData';
import { useApiError } from '@/hooks/useApiError';
import useToasts from '@/hooks/useToasts';
import ToastNotification from '../components/ui/ToastNotification';
import InlineError from '../components/ui/InlineError';
import type { GameType } from '@shared/types';
import type { CashGameListProps } from '../components/home/CashGameList';
import { type TournamentListProps } from '@/components/TournamentList';
import { registerTournament } from '@/lib/api/lobby';
import ChatWidget from '../components/common/chat/ChatWidget';

interface TournamentWithBreak extends Tournament {
  nextBreak?: string;
  breakDurationMs?: number;
}

const CashGameListDefault = dynamic<CashGameListProps>(
  () => import('../components/home/CashGameList'),
  {
    loading: () => (
      <section
        id="cash-games-panel"
        role="tabpanel"
        aria-labelledby="tab-texas"
        className="mb-6 md:mb-8"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
          Cash Games
        </h2>
        <div className="h-96 w-full rounded-2xl bg-card-bg animate-pulse" />
      </section>
    ),
  },
);

const TournamentListDefault = dynamic<TournamentListProps<TournamentWithBreak>>(
  () => import('@/components/TournamentList'),
  {
    loading: () => (
      <section
        id="tournaments-panel"
        role="tabpanel"
        aria-labelledby="tab-tournaments"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6">
          Tournaments
        </h2>
        <div className="h-96 w-full rounded-2xl bg-card-bg animate-pulse" />
      </section>
    ),
  },
);

export function HomePageClient({
  cashGameList,
  tournamentList,
}: {
  cashGameList?: React.ComponentType<CashGameListProps>;
  tournamentList?: React.ComponentType<
    TournamentListProps<TournamentWithBreak>
  >;
}) {
  const CashGameList = cashGameList ?? CashGameListDefault;
  const TournamentList = tournamentList ?? TournamentListDefault;

  const SiteTournamentList = (
    props: TournamentListProps<TournamentWithBreak>,
  ) => <TournamentList {...props} />;

  const [gameType, setGameType] = useState<GameType>('texas');
  const { toasts, pushToast } = useToasts();
  const [registering, setRegistering] = useState(false);

  const {
    data: tables,
    error: tablesError,
    isLoading: tablesLoading,
  } = useTables();
  const {
    data: tournaments,
    error: tournamentsError,
    isLoading: tournamentsLoading,
  } = useTournaments();

  const tableErrorMessage = useApiError(tablesError);
  const tournamentErrorMessage = useApiError(tournamentsError);

  const filteredTables = useMemo(() => {
    if (!tables || gameType === 'tournaments') return [];
    return tables.filter((t) => t.gameType === gameType);
  }, [gameType, tables]);

  const showTournaments = gameType === 'tournaments';

  if (
    (!showTournaments && tablesLoading) ||
    (showTournaments && tournamentsLoading)
  ) {
    return (
      <>
        <HomeLoadingSkeleton />
        <ChatWidget />
      </>
    );
  }

  const handleRegister = async (id: string) => {
    setRegistering(true);
    try {
      await registerTournament(id);
    } catch (err) {
      pushToast(useApiError(err), { variant: 'error' });
      return;
    } finally {
      setRegistering(false);
    }
  };

  return (
    <>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)] bg-primary-bg text-text-primary">
        <TopCTAs />
        <GameTabs gameType={gameType} setGameType={setGameType} />

        <CashGameList
          tables={filteredTables}
          gameType={gameType}
          hidden={showTournaments}
        />
        {!showTournaments && tableErrorMessage && (
          <InlineError message={tableErrorMessage} />
        )}

        <div
          aria-busy={registering}
          className={registering ? 'pointer-events-none opacity-50' : undefined}
        >
          <SiteTournamentList
            tournaments={tournaments ?? []}
            hidden={!showTournaments}
            onRegister={handleRegister}
          />
        </div>
        {showTournaments && tournamentErrorMessage && (
          <InlineError message={tournamentErrorMessage} />
        )}
      </main>

      <ChatWidget />

      {toasts.map((t) => (
        <ToastNotification
          key={t.id}
          message={t.message}
          type={t.variant === 'error' ? 'error' : 'success'}
          isOpen
          duration={t.duration}
          onClose={() => {}}
        />
      ))}
    </>
  );
}
