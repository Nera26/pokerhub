import React from 'react';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface PlayingCardProps {
  rank: string;
  suit: Suit;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  active?: boolean;
}

const suitPaths: Record<Suit, React.ReactNode> = {
  hearts: (
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.5 4 5.5 4 7.04 4 8.54 4.99 9 6.17 9.46 4.99 10.96 4 12.5 4 14.5 4 16 6 16 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  ),
  diamonds: (
    <path d="M12 2l7 10-7 10-7-10 7-10z" />
  ),
  clubs: (
    <path d="M12 3c-2.21 0-4 1.79-4 4 0 .35.05.69.15 1.01C6.9 8.42 6 9.9 6 11.5 6 13.99 8.01 16 10.5 16H11v2H8v2h8v-2h-3v-2h.5c2.49 0 4.5-2.01 4.5-4.5 0-1.6-.9-3.08-2.15-3.49.1-.32.15-.66.15-1.01 0-2.21-1.79-4-4-4z" />
  ),
  spades: (
    <path d="M12 2C7 7 5 9.5 5 12.5 5 15.54 7.46 18 10.5 18H11v2H8v2h8v-2h-3v-2h.5C16.54 18 19 15.54 19 12.5 19 9.5 17 7 12 2z" />
  ),
};

const sizeStyles = {
  sm: {
    card: 'w-[56px] h-[78px] md:w-[60px] md:h-[84px]',
    rank: 'text-sm md:text-base',
    cornerSuit: 'w-3 h-3 md:w-4 md:h-4',
    centerSuit: 'w-6 h-6 md:w-8 md:h-8',
  },
  md: {
    card: 'w-[64px] h-[92px] md:w-[72px] md:h-[104px]',
    rank: 'text-lg md:text-xl',
    cornerSuit: 'w-4 h-4 md:w-5 md:h-5',
    centerSuit: 'w-8 h-8 md:w-10 md:h-10',
  },
  lg: {
    card: 'w-[74px] h-[102px] md:w-[78px] md:h-[108px]',
    rank: 'text-xl md:text-2xl',
    cornerSuit: 'w-5 h-5 md:w-6 md:h-6',
    centerSuit: 'w-10 h-10 md:w-12 md:h-12',
  },
};

const LINEN_TEX =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cmVjdCB3aWR0aD0iMiIgaGVpZ2h0PSIyIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==';

export function PlayingCard({ rank, suit, size = 'md', className = '', active = false }: PlayingCardProps) {
  const color = suit === 'hearts' || suit === 'diamonds' ? 'text-red-500 fill-red-500' : 'text-gray-900 fill-gray-900';
  const sz = sizeStyles[size];

  const SuitIcon = () => (
    <svg viewBox="0 0 24 24" className={`${color} ${sz.centerSuit}`}>{suitPaths[suit]}</svg>
  );

  return (
    <div
      className={[
        'relative flex items-center justify-center rounded-xl bg-white border font-bold select-none overflow-hidden transition-shadow',
        "after:content-[''] after:absolute after:inset-0 after:rounded-xl after:pointer-events-none after:shadow-[inset_0_2px_rgba(255,255,255,0.7),inset_0_-2px_rgba(0,0,0,0.2)]",
        active
          ? 'shadow-[0_0_12px_rgba(255,255,255,0.6),0_2px_6px_rgba(0,0,0,0.45)]'
          : 'shadow-[0_2px_6px_rgba(0,0,0,0.45)] hover:shadow-[0_0_12px_rgba(255,255,255,0.4),0_2px_6px_rgba(0,0,0,0.45)]',
        sz.card,
        className,
      ].join(' ')}
    >
      <div
        className="absolute inset-0 rounded-xl pointer-events-none opacity-20"
        style={{ backgroundImage: `url(${LINEN_TEX})` }}
      />
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.1))' }}
      />
      <div className={`absolute top-1 left-1 flex flex-col items-center leading-none ${color}`}>
        <span className={sz.rank}>{rank}</span>
        <svg viewBox="0 0 24 24" className={`${color} ${sz.cornerSuit}`}>{suitPaths[suit]}</svg>
      </div>
      <SuitIcon />
      <div className={`absolute bottom-1 right-1 rotate-180 flex flex-col items-center leading-none ${color}`}>
        <span className={sz.rank}>{rank}</span>
        <svg viewBox="0 0 24 24" className={`${color} ${sz.cornerSuit}`}>{suitPaths[suit]}</svg>
      </div>
    </div>
  );
}

export default PlayingCard;

