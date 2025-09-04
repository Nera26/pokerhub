'use client';

import type { GameState } from '@shared/types';

type Player = GameState['players'][number];

export default function Seats({
  players,
}: {
  players: Player[];
}) {
  if (!players.length) {
    return <p data-testid="no-players">No players</p>;
  }

  return (
    <ul className="space-y-1" data-testid="seats">
      {players.map((p) => (
        <li key={p.id} className="text-sm">
          {p.id}: {p.stack}
        </li>
      ))}
    </ul>
  );
}

