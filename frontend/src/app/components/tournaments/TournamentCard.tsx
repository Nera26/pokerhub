// Motion transition: m.base
'use client';

import SmoothButton from '../ui/SmoothButton';
import dynamic from 'next/dynamic';
import { m } from '@/lib/motion';
import useRenderCount from '@/hooks/useRenderCount';

const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false },
);

export type TournamentStatus = 'upcoming' | 'running' | 'past';

export interface TournamentCardProps {
  /** Unique identifier for the tournament */
  id: string;
  /** Current status */
  status: TournamentStatus;
  /** Display name */
  name: string;
  /** Game type and variant, e.g. "Texas Hold'em – No Limit" */
  gameType: string;
  /** Buy-in cost */
  buyin: number;
  /** Rebuy details string */
  rebuy: string;
  /** Total prize pool */
  prizepool: number;
  /** Current number of registered players */
  players: number;
  /** Maximum capacity */
  maxPlayers: number;
  /** Text for start countdown, e.g. "2h 15m" (only for upcoming) */
  startIn?: string;
  /** Register callback (for upcoming) */
  onRegister?: (id: string) => void;
  /** View details callback (for running/past) */
  onViewDetails?: (id: string) => void;
}

export default function TournamentCard({
  id,
  status,
  name,
  gameType,
  buyin,
  rebuy,
  prizepool,
  players,
  maxPlayers,
  startIn,
  onRegister,
  onViewDetails,
}: TournamentCardProps) {
  useRenderCount('TournamentCard');
  const isUpcoming = status === 'upcoming';
  const isRunning = status === 'running';

  const buttonLabel = isUpcoming
    ? 'REGISTER NOW'
    : isRunning
      ? 'VIEW DETAILS'
      : 'VIEW RESULTS';

  const handleClick = () => {
    if (isUpcoming) onRegister?.(id);
    else onViewDetails?.(id);
  };

  return (
    <MotionDiv
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={m.base}
      className="bg-card-bg rounded-2xl p-6 hover:bg-hover-bg flex flex-col justify-between motion-safe:transition-transform motion-reduce:!transform-none"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1 text-text-primary">{name}</h3>
          <p className="text-text-secondary text-sm">{gameType}</p>
        </div>
        <div className="text-right">
          <p className="text-accent-yellow font-bold">
            ${buyin.toLocaleString()}
          </p>
          <p className="text-text-secondary text-sm">Buy-in</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-text-secondary">Prize Pool</p>
          <p className="font-semibold">${prizepool.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-text-secondary">Players</p>
          <p className="font-semibold">
            {players} / {maxPlayers}
          </p>
        </div>
        <div>
          <p className="text-text-secondary">Rebuy</p>
          <p className="font-semibold">{rebuy}</p>
        </div>
        <div>
          <p className="text-text-secondary">
            {isUpcoming ? 'Starts In' : 'Status'}
          </p>
          <p
            className={`${isUpcoming ? 'text-accent-yellow' : 'text-accent-green'} font-semibold`}
          >
            {isUpcoming ? startIn || 'TBA' : isRunning ? 'Running' : 'Ended'}
          </p>
        </div>
      </div>

      {/* Action button */}
      <SmoothButton
        variant={isUpcoming ? 'primary' : 'outline'}
        className="w-full uppercase"
        onClick={handleClick}
      >
        {buttonLabel}
      </SmoothButton>
    </MotionDiv>
  );
}
