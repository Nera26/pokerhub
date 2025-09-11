'use client';

import { useTableTheme } from '@/hooks/useTableTheme';
import type { Player } from './types';
import Image from 'next/image';
import React from 'react';

export interface PlayerAvatarProps {
  player: Player;
  pos?: string;
  wrapperClass: string;
  avatarClass: string;
  avatarRingStyle: React.CSSProperties;
}

const FALLBACK_AVATAR =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

export default function PlayerAvatar({
  player,
  pos,
  wrapperClass,
  avatarClass,
  avatarRingStyle,
}: PlayerAvatarProps) {
  const { data, isLoading, isError } = useTableTheme();
  if (isLoading) {
    return (
      <div className={[wrapperClass, 'w-full flex justify-center'].join(' ')}>
        Loading table theme...
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className={[wrapperClass, 'w-full flex justify-center'].join(' ')}>
        Failed to load theme
      </div>
    );
  }
  const hairline = data.hairline;
  const positions = data.positions;
  const ring = pos ? positions[pos] : undefined;

  return (
    <div className={[wrapperClass, 'w-full flex justify-center'].join(' ')}>
      <div className={['relative', avatarClass].join(' ')}>
        <Image
          src={player.avatar || FALLBACK_AVATAR}
          alt={player.username}
          fill
          sizes="64px"
          className={[
            'rounded-full object-cover shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]',
            player.isFolded ? 'saturate-50' : '',
          ].join(' ')}
        />

        {/* Hairline ring */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full border"
          style={{ borderColor: hairline }}
        />

        {/* Glowing position ring */}
        <svg
          className="pointer-events-none absolute -inset-0.5"
          viewBox="0 0 100 100"
          // Provide --ring-color via custom property + preserve incoming styles
          style={{
            ...(avatarRingStyle || {}),
            // TS doesn't include CSS vars on CSSProperties; cast to any:
            ...({ ['--ring-color']: ring?.color ?? 'transparent' } as any),
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            stroke="var(--ring-color)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            style={{
              filter: 'drop-shadow(0 0 4px var(--ring-color))',
            }}
          />
        </svg>
      </div>
    </div>
  );
}
