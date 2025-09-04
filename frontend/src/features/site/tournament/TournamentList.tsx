'use client';

import { Tournament } from '@/hooks/useLobbyData';
import TournamentListBase from '@/components/TournamentList';
import useRenderCount from '@/hooks/useRenderCount';
import RegisterButton from './RegisterButton';
import BreakTimer from './BreakTimer';

interface TournamentWithBreak extends Tournament {
  nextBreak?: string;
  breakDurationMs?: number;
}

export interface TournamentListProps {
  tournaments: TournamentWithBreak[];
  hidden: boolean;
}

export default function TournamentList({
  tournaments,
  hidden,
}: TournamentListProps) {
  useRenderCount('SiteTournamentList');

  return (
    <TournamentListBase
      tournaments={tournaments}
      hidden={hidden}
      renderExtras={(t) => (
        <>
          {t.state === 'CANCELLED' && (
            <p className="text-red-500 text-sm mb-4">Cancelled</p>
          )}
          {t.nextBreak && t.breakDurationMs && (
            <p className="text-text-secondary text-sm mb-4">
              Next break in{' '}
              <BreakTimer
                start={Date.parse(t.nextBreak)}
                durationMs={t.breakDurationMs}
              />
            </p>
          )}
        </>
      )}
      renderActions={(t) => (
        <RegisterButton id={t.id} initialRegistered={t.registered} />
      )}
    />
  );
}

