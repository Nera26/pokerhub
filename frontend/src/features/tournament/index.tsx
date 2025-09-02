'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchTournaments,
  registerTournament,
  type Tournament as ApiTournament,
} from '@/lib/api/lobby';
import Header from '@/app/components/common/Header';
import BottomNav from '@/app/components/common/BottomNav';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { TournamentFilter } from '@/app/components/tournaments/TournamentFilters';
import type { TournamentStatus } from '@/app/components/tournaments/TournamentCard';
import useVirtualizedList from '@/hooks/useVirtualizedList';
import useRenderCount from '@/hooks/useRenderCount';
import ErrorBoundary from '@/app/components/ui/ErrorBoundary';
import TournamentFilters from '@/app/components/tournaments/TournamentFilters';
import TournamentCard from '@/app/components/tournaments/TournamentCard';
import TournamentRegisterModalContent from '@/app/components/tournaments/TournamentRegisterModalContent';
import Modal from '@/app/components/ui/Modal';
import ToastNotification from '@/app/components/ui/ToastNotification';

interface Tournament {
  id: string;
  status: TournamentStatus;
  name: string;
  gameType: string;
  buyin: number;
  rebuy: string;
  prizepool: number;
  players: number;
  maxPlayers: number;
  startIn?: string;
}

function isTournamentFilter(v: string | null): v is TournamentFilter {
  return v === 'active' || v === 'upcoming' || v === 'past';
}

export default function Page() {
  useRenderCount('TournamentPage');
  const queryClient = useQueryClient();
  // 1) filter state synced with URL
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [filter, setFilter] = useState<TournamentFilter>(() => {
    const q = search.get('filter');
    return isTournamentFilter(q) ? q : 'active';
  });

  useEffect(() => {
    const qs = new URLSearchParams(search.toString());
    if (qs.get('filter') !== filter) {
      qs.set('filter', filter);
      router.replace(`${pathname}?${qs.toString()}`);
    }
  }, [filter, router, pathname, search]);

  // 2) fetch tournaments data
  const { data, isLoading, error } = useQuery<ApiTournament[], Error>({
    queryKey: ['tournaments'],
    queryFn: ({ signal }) => fetchTournaments({ signal }),
  });

  const tournaments: Tournament[] = useMemo(
    () =>
      (data ?? []).map((t) => ({
        id: t.id,
        status: 'upcoming',
        name: t.title,
        gameType: "Texas Hold'em – No Limit",
        buyin: t.buyIn,
        rebuy: t.fee ? `${t.fee} fee` : 'None',
        prizepool:
          typeof t.prizePool === 'number'
            ? t.prizePool
            : Number(t.prizePool) || 0,
        players: t.players.current,
        maxPlayers: t.players.max,
      })),
    [data],
  );

  // 3) modal & toast state
  const [openModalId, setOpenModalId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isOpen: boolean;
  }>({
    message: '',
    type: 'success',
    isOpen: false,
  });

  // 4) derive filtered list
  const visible = useMemo(
    () =>
      tournaments.filter((t) => {
        if (filter === 'active')
          return t.status === 'running' || t.status === 'upcoming';
        if (filter === 'upcoming') return t.status === 'upcoming';
        return t.status === 'past';
      }),
    [tournaments, filter],
  );

  // 5) virtualized list
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizedList<HTMLDivElement>({
    count: visible.length,
    parentRef,
  });

  // 6) handlers
  const handleRegisterClick = (id: string) => setOpenModalId(id);
  const handleModalClose = () => setOpenModalId(null);

  const handleConfirm = async (id: string) => {
    try {
      await registerTournament(id);
      await queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setToast({
        message: "You're registered!",
        type: 'success',
        isOpen: true,
      });
      setOpenModalId(null);
    } catch {
      setToast({
        message: 'Failed to register. Please try again.',
        type: 'error',
        isOpen: true,
      });
    }
  };

  const closeToast = () => setToast((t) => ({ ...t, isOpen: false }));

  return (
    <>
      <Header />

      <main
        id="main-content"
        className="container mx-auto p-6 pb-[calc(env(safe-area-inset-bottom)+72px)] space-y-6"
      >
        <h1 className="text-2xl font-bold">Tournaments</h1>

        <ErrorBoundary fallback={<div>Error loading filters.</div>}>
          <TournamentFilters selected={filter} onChange={setFilter} />
        </ErrorBoundary>

        <div ref={parentRef} className="h-96 overflow-auto">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-64 w-full rounded-2xl bg-card-bg animate-pulse"
              />
            ))}
          {error && (
            <p className="text-center text-text-secondary">
              Failed to load tournaments.
            </p>
          )}
          {!isLoading && !error && visible.length === 0 && (
            <p className="text-center text-text-secondary">
              No tournaments in this category.
            </p>
          )}
          {!isLoading && !error && visible.length > 0 && (
            <ul
              className="m-0 p-0 list-none"
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const t = visible[virtualRow.index];
                return (
                  <li
                    key={t.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="mb-6"
                  >
                    <ErrorBoundary
                      fallback={
                        <div className="h-64 w-full rounded-2xl bg-card-bg flex items-center justify-center">
                          Error loading tournament.
                        </div>
                      }
                    >
                      <TournamentCard
                        id={t.id}
                        status={t.status}
                        name={t.name}
                        gameType={t.gameType}
                        buyin={t.buyin}
                        rebuy={t.rebuy}
                        prizepool={t.prizepool}
                        players={t.players}
                        maxPlayers={t.maxPlayers}
                        startIn={t.startIn}
                        onRegister={handleRegisterClick}
                      />
                    </ErrorBoundary>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <BottomNav />

      {/* Registration Modal */}
      {openModalId && (
        <Modal isOpen onClose={handleModalClose}>
          <ErrorBoundary fallback={<div>Error loading registration.</div>}>
            <TournamentRegisterModalContent
              details={{
                name: tournaments.find((t) => t.id === openModalId)!.name,
                buyin: tournaments.find((t) => t.id === openModalId)!.buyin,
                overview: [
                  {
                    title: 'Tournament Format',
                    description: "No-Limit Hold'em with 20k starting chips.",
                  },
                  {
                    title: 'Late Registration',
                    description: 'Allowed for first 2 hours, one re-entry.',
                  },
                ],
                structure: [
                  {
                    title: 'Blind Structure',
                    description: 'Level 1: 100/200, Level 2: 200/400, …',
                  },
                ],
                prizes: [
                  {
                    title: 'Prizes',
                    description:
                      '1st: 50%, 2nd: 25%, 3rd: 15%, remainder split.',
                  },
                ],
              }}
              onClose={handleModalClose}
              onConfirm={() => handleConfirm(openModalId!)}
            />
          </ErrorBoundary>
        </Modal>
      )}

      {/* Toast */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={closeToast}
      />
    </>
  );
}
