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
  // Robust against undefined while fetching
  const { data } = useTableTheme();
  const hairline = data?.hairline ?? 'transparent';
  const positions = data?.positions ?? {};
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
            ...( { ['--ring-color']: ring?.color ?? 'transparent' } as any ),
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

        {/* Position badge / label */}
        {pos &&
          (ring?.badge ? (
            <Image
              src={ring.badge}
              alt={pos}
              width={32}
              height={32}
              sizes="32px"
              className="pointer-events-none absolute -bottom-1 -right-1 translate-x-1/3 translate-y-1/3 z-10 w-8 h-8 rounded-full"
              style={{
                filter: `drop-shadow(0 0 4px ${ring?.glow ?? 'transparent'})`,
              }}
            />
          ) : (
            <span
              className="pointer-events-none absolute -bottom-1 -right-1 px-1 rounded text-[10px] font-semibold"
              style={{
                color: ring?.color ?? 'inherit',
                // Use a neutral background if there's no SVG badge asset:
                backgroundColor: 'rgba(0,0,0,0.6)',
                boxShadow: `0 0 6px ${ring?.glow ?? 'transparent'}`,
              }}
            >
              {pos}
            </span>
          ))}
      </div>
    </div>
  );
}
