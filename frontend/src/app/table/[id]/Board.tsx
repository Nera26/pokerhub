'use client';

import type { GameState } from '@shared/types';

export default function Board({
  cards,
}: {
  cards: GameState['communityCards'];
}) {
  return (
    <div data-testid="board" className="text-center text-lg">
      {cards.length ? cards.join(' ') : 'No cards'}
    </div>
  );
}

