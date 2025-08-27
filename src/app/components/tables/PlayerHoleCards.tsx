'use client';

import React, { useEffect, useState } from 'react';

function CardBack({ className = '' }: { className?: string }) {
  return (
    <div
      className={[
        'rounded-xl border border-border-color/70',
        'bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)]',
        'backdrop-blur-[0.5px] shadow-[0_6px_14px_rgba(0,0,0,0.35)]',
        className,
      ].join(' ')}
    />
  );
}

const isRed = (c: string) => c.includes('♥') || c.includes('♦');

function HeroCard({ card, index }: { card: string; index: number }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
    const t = setTimeout(() => setFlipped(true), 200 + index * 150);
    return () => clearTimeout(t);
  }, [card, index]);

  const red = isRed(card);
  const tilt = index === 0 ? -10 : 10;
  const shift = index === 0 ? 8 : -8;

  return (
    <div
      className="w-[64px] h-[92px] md:w-[68px] md:h-[96px]"
      style={{
        transform: `translateX(${shift}px) rotate(${tilt}deg)`,
      }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped
            ? 'translateY(0) rotateY(180deg)'
            : 'translateY(20px) rotateY(0deg)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardBack className="w-full h-full" />
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-white border shadow-[0_12px_32px_rgba(0,0,0,0.6)] ring-4 ring-accent-yellow/90 drop-shadow-[0_0_12px_rgba(255,255,0,0.8)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className={red ? 'playing-card--red text-xl' : 'playing-card--black text-xl'}>{card}</span>
        </div>
      </div>
    </div>
  );
}

export interface PlayerHoleCardsProps {
  cards: string[];
  isHero: boolean;
}

export default function PlayerHoleCards({ cards, isHero }: PlayerHoleCardsProps) {
  if (cards.length === 0) return null;

  return isHero ? (
    <div
      className="relative mt-3 pb-8 flex items-end justify-center gap-2 z-20"
    >
      {cards.slice(0, 2).map((c, i) => (
        <HeroCard key={i} card={c} index={i} />
      ))}
    </div>
  ) : (
    <div className="mt-2 flex items-center justify-center gap-1 z-20">
      <CardBack className="w-[50px] h-[72px] md:w-[54px] md:h-[78px] -rotate-6 translate-x-1" />
      <CardBack className="w-[50px] h-[72px] md:w-[54px] md:h-[78px] rotate-6 -translate-x-1" />
    </div>
  );
}
