'use client';

import { useEffect, useState } from 'react';
import type { GameState } from '@shared/types';
import { readPlayers, readCommunityCards } from '@shared/state';
import Board from '@/app/table/[id]/Board';
import Seats from '@/app/table/[id]/Seats';
import { subscribeToTable, disconnectSpectatorSocket } from '@/lib/spectator-socket';

interface SpectatorProps {
  tableId: string;
}

export default function SpectatorTable({ tableId }: SpectatorProps) {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToTable(tableId, setState);
    return () => {
      unsubscribe();
      disconnectSpectatorSocket();
    };
  }, [tableId]);

  const players = readPlayers(state);
  const communityCards = readCommunityCards(state);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Watching Table {tableId}</h1>
      <Board cards={communityCards} />
      <Seats players={players} />
    </div>
  );
}

