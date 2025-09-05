'use client';

import type { CSSProperties, HTMLAttributes } from 'react';
import PlayingCard, { type Suit } from './PlayingCard';

const motion = { div: (props: HTMLAttributes<HTMLDivElement>) => <div {...props} /> };

function CardBack() {
  return (
    <div
      className={[
        'w-full h-full rounded-xl border border-border-dark/70',
        'bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)]',
        'backdrop-blur-[0.5px] shadow-[0_6px_14px_rgba(0,0,0,0.35)]',
      ].join(' ')}
    />
  );
}

export interface CommunityCardsProps {
  cards: string[]; // ex: ['A♥','K♠','Q♦']
}

export default function CommunityCards({ cards = [] }: CommunityCardsProps) {
  const totalSlots = 5;
  const placeholders = Math.max(0, totalSlots - cards.length);

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 z-10"
      style={{ perspective: '1200px' }}
    >
      <div
        className="flex items-end"
        style={{ transformStyle: 'preserve-3d', transform: 'rotateX(8deg)' }}
      >
        {(cards ?? []).map((card, idx) => {
          const rank = card.slice(0, -1);
          const suitChar = card.slice(-1);
          const suitMap: Record<string, Suit> = {
            '♥': 'hearts',
            '♦': 'diamonds',
            '♣': 'clubs',
            '♠': 'spades',
          };

          return (
            <motion.div
              key={`cc-${idx}`}
              className="relative will-change-transform"
              style={{ '--x': `${idx * 6}px`, '--delay': `${idx * 120}ms` } as CSSProperties}
            >
              <div
                className="relative w-[64px] h-[92px] md:w-[72px] md:h-[104px]"
                style={{
                  transformStyle: 'preserve-3d',
                  animation: `ccDeal 600ms ease-out var(--delay) both`,
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <CardBack />
                </div>
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <PlayingCard
                    rank={rank}
                    suit={suitMap[suitChar]}
                    size="md"
                    className="shadow-[0_12px_26px_rgba(0,0,0,0.5)] ring-1 ring-white/20"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        {Array.from({ length: placeholders }).map((_, idx) => (
          <div
            key={`ph-${idx}`}
            className="relative w-[64px] h-[92px] md:w-[72px] md:h-[104px] rounded-xl border-2 border-dashed border-border-dark bg-card-bg shadow-[0_10px_22px_rgba(0,0,0,0.35)]"
            style={{
              transform: `rotateX(1deg) rotateZ(${idx % 2 ? 2 : -2}deg) translateZ(0.01px) translateX(${(cards.length + idx) * 6}px)`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes ccDeal {
          0% {
            transform: rotateY(0deg) translateY(8px) translateX(var(--x));
            opacity: 0;
          }
          60% {
            transform: rotateY(90deg) translateY(2px) translateX(var(--x));
            opacity: 1;
          }
          100% {
            transform: rotateY(180deg) translateY(0px) translateX(var(--x));
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
