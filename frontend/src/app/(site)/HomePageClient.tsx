'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TopCTAs, GameTabs, HomeLoadingSkeleton } from '../components/home';
import {
  useTables,
  useTournaments,
  type Tournament,
} from '@/hooks/useLobbyData';
import { useApiError } from '@/hooks/useApiError';
import InlineError from '../components/ui/InlineError';
import type { GameType } from '@shared/types';
import type { CashGameListProps } from '../components/home/CashGameList';
import { type TournamentListProps } from '@/components/TournamentList';
import useRenderCount from '@/hooks/useRenderCount';
import { registerTournament } from '@/lib/api/lobby';

interface TournamentWithBreak extends Tournament {
  nextBreak?: string;
  breakDurationMs?: number;
}

const ChatPlaceholder = () => (
  <div className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-card-bg animate-pulse" />
);

let ChatWidget: React.ComponentType | null = null;

let CashGameList: React.ComponentType<CashGameListProps> =
  dynamic<CashGameListProps>(() => import('../components/home/CashGameList'), {
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
  });

if (CashGameList.displayName === 'DynamicMock') {
  CashGameList = require('../components/home/CashGameList').default;
}

let TournamentList: React.ComponentType<
  TournamentListProps<TournamentWithBreak>
> =
  dynamic<TournamentListProps<TournamentWithBreak>>(
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

if (TournamentList.displayName === 'DynamicMock') {
  TournamentList = require('@/components/TournamentList').default;
}

const SiteTournamentList = (
  props: TournamentListProps<TournamentWithBreak>,
) => {
  useRenderCount('SiteTournamentList');
  return <TournamentList {...props} />;
};

export default function HomePageClient() {
  const [gameType, setGameType] = useState<GameType>('texas');

  useEffect(() => {
    const load = () =>
      import('../components/common/chat/ChatWidget').then(
        (mod) => (ChatWidget = mod.default),
      );
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as Window & typeof globalThis).requestIdleCallback(load);
      } else {
        setTimeout(load, 1);
      }
    }
  }, []);

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
        {ChatWidget ? <ChatWidget /> : <ChatPlaceholder />}
      </>
    );
  }

  const handleRegister = async (id: string) => {
    try {
      await registerTournament(id);
    } catch {
      // ignore errors for now
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

        <SiteTournamentList
          tournaments={tournaments ?? []}
          hidden={!showTournaments}
          onRegister={handleRegister}
        />
        {showTournaments && tournamentErrorMessage && (
          <InlineError message={tournamentErrorMessage} />
        )}
      </main>
      {ChatWidget ? <ChatWidget /> : <ChatPlaceholder />}
    </>
  );
}
