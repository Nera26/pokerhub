// Motion transition: m.base
'use client';

import React, { forwardRef } from 'react';
import SmoothButton from '../ui/SmoothButton';
import Button from '../ui/Button';
import dynamic from 'next/dynamic';
import { m } from '@/lib/motion';

const MotionArticle = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.article),
  { ssr: false },
);

export interface LiveTableCardProps {
  /** Table display name */
  tableName: string;
  /** Stakes: small blind and big blind values */
  stakes: { small: number; big: number };
  /** Current and maximum number of players */
  players: { current: number; max: number };
  /** Buy-in range */
  buyIn: { min: number; max: number };
  /** Performance stats */
  stats: { handsPerHour: number; avgPot: number; rake: number };
  /** Time since creation, e.g. "2h ago" */
  createdAgo: string;
  /** Optional join action handler */
  onJoin?: () => void;
  /** Optional href for navigation */
  href?: string;
  spectateHref?: string;
  /** Optional style for virtualization */
  style?: React.CSSProperties;
}

const LiveTableCard = forwardRef<HTMLDivElement, LiveTableCardProps>(
  (
    {
      tableName,
      stakes,
      players,
      buyIn,
      stats,
      createdAgo,
      onJoin,
      href,
      spectateHref,
      style,
    },
    ref,
  ) => {
    return (
      <MotionArticle
        ref={ref}
        style={style}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={m.base}
        className="bg-card-bg rounded-2xl p-[20px] flex flex-col justify-between hover:bg-hover-bg group relative motion-safe:transition-transform motion-reduce:!transform-none"
      >
        {/* Hover overlay showing detailed stats */}
        <div
          data-testid="stats-overlay"
          aria-hidden="true"
          className="absolute inset-0 bg-black bg-opacity-75 rounded-2xl transition-opacity duration-100 z-10 flex flex-col justify-center items-center text-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none"
        >
          <div className="text-sm text-text-secondary space-y-1">
            <p>
              Hands/hour:{' '}
              <span className="text-accent-yellow">{stats.handsPerHour}</span>
            </p>
            <p>
              Avg Pot:{' '}
              <span className="text-accent-green">${stats.avgPot}</span>
            </p>
            <p>
              Rake: <span className="text-text-primary">{stats.rake}%</span>
            </p>
            <p>
              Created: <span className="text-text-primary">{createdAgo}</span>
            </p>
          </div>
        </div>
        <div className="sr-only">
          Hands/hour: {stats.handsPerHour}; Avg Pot: ${stats.avgPot}; Rake:{' '}
          {stats.rake}%; Created: {createdAgo}
        </div>

        {/* Main card content */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">
            {tableName}
          </h3>
          <div className="flex justify-between items-center text-text-secondary text-sm sm:text-base mb-3">
            <span>
              Stakes:{' '}
              <span className="text-accent-yellow font-semibold">
                ${stakes.small}/{stakes.big}
              </span>
            </span>
            <span>
              Players:{' '}
              <span className="text-text-primary font-semibold">
                {players.current}/{players.max}
              </span>
            </span>
          </div>
          <p className="text-text-secondary text-xs sm:text-sm mb-4">
            Buy-in:{' '}
            <span className="text-text-primary font-semibold">
              ${buyIn.min} - ${buyIn.max}
            </span>
          </p>
        </div>

        {/* Actions */}
        {href ? (
          <Button href={href} className="w-full uppercase">
            Join Table
          </Button>
        ) : (
          <SmoothButton
            onClick={onJoin}
            variant="primary"
            className="w-full uppercase"
          >
            Join Table
          </SmoothButton>
        )}
        {spectateHref && (
          <Button
            href={spectateHref}
            variant="outline"
            className="w-full mt-2 uppercase"
          >
            Spectate
          </Button>
        )}
      </MotionArticle>
    );
  },
);

LiveTableCard.displayName = 'LiveTableCard';

export default LiveTableCard;
