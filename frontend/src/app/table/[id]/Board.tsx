'use client';

export default function Board({ cards }: { cards: string[] }) {
  return (
    <div data-testid="board" className="text-center text-lg">
      {cards.length ? cards.join(' ') : 'No cards'}
    </div>
  );
}

