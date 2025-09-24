'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchTournamentBracket,
  type TournamentBracketResponse,
} from '@/lib/api/history';
import Modal from '../ui/Modal';

interface Props {
  isOpen: boolean;
  tournament: { id: string; title: string } | null;
  onClose(): void;
}

export default function BracketModal({ isOpen, tournament, onClose }: Props) {
  const tournamentId = tournament?.id;
  const { data, isLoading, isError } = useQuery<TournamentBracketResponse>({
    queryKey: ['tournament-bracket', tournamentId],
    queryFn: ({ signal }) => fetchTournamentBracket(tournamentId!, { signal }),
    enabled: isOpen && Boolean(tournamentId),
  });

  let content: ReactNode;
  if (!tournamentId) {
    content = (
      <p className="text-text-secondary">
        Select a tournament to view its bracket.
      </p>
    );
  } else if (isLoading) {
    content = <p className="text-text-secondary">Loading bracket...</p>;
  } else if (isError) {
    content = (
      <p className="text-danger-red">Failed to load tournament bracket.</p>
    );
  } else if (!data || data.rounds.length === 0) {
    content = <p className="text-text-secondary">No bracket data available.</p>;
  } else {
    content = (
      <div className="space-y-4 max-h-[24rem] overflow-y-auto pr-2">
        {data.rounds.map((round) => (
          <div
            key={`${data.tournamentId}-${round.name}`}
            className="bg-primary-bg rounded-xl p-4 border border-border-dark"
          >
            <h4 className="text-lg font-semibold mb-3">{round.name}</h4>
            <ul className="space-y-3">
              {round.matches.map((match) => (
                <li
                  key={match.id}
                  className="flex flex-col gap-1 rounded-lg bg-card-bg p-3"
                >
                  <p className="font-medium">
                    {match.players.length > 0
                      ? match.players.join(' vs ')
                      : 'TBD'}
                  </p>
                  <span className="text-sm text-text-secondary">
                    {match.winner ? `Winner: ${match.winner}` : 'Winner TBD'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col space-y-4">
        <h3 className="text-xl font-bold">
          {tournament ? `${tournament.title} Bracket` : 'Tournament Bracket'}
        </h3>
        {content}
      </div>
    </Modal>
  );
}
