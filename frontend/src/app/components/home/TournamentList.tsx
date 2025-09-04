'use client';

import { Tournament } from '@/hooks/useLobbyData';
import TournamentListBase from '@/components/TournamentList';
import Button from '../ui/Button';
import useRenderCount from '@/hooks/useRenderCount';

export interface TournamentListProps {
  tournaments: Tournament[];
  hidden: boolean;
}

export default function TournamentList({
  tournaments,
  hidden,
}: TournamentListProps) {
  useRenderCount('TournamentList');

  return (
    <TournamentListBase
      tournaments={tournaments}
      hidden={hidden}
      renderActions={(t) =>
        t.registered ? (
          <Button variant="outline" size="sm">
            Registered
          </Button>
        ) : (
          <Button variant="primary" size="sm">
            Register
          </Button>
        )
      }
    />
  );
}

