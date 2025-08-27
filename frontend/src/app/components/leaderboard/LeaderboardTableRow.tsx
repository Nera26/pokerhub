// Motion transition: m.fast
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import Tooltip from '../ui/Tooltip';
import { Player } from '../leaderboard/LeaderboardTable';
import dynamic from 'next/dynamic';
import { m } from '@/lib/motion';
import useRenderCount from '@/hooks/useRenderCount';

const MotionTr = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.tr),
  { ssr: false },
);

export interface LeaderboardTableRowProps {
  /** Player data */
  player: Player;
  /** 1-based rank position */
  rank: number;
  /** Click handler for row */
  onClick?: (player: Player) => void;
}

function LeaderboardTableRow({
  player,
  rank,
  onClick,
}: LeaderboardTableRowProps) {
  useRenderCount('LeaderboardTableRow');
  const { username, avatar, winnings, gamesPlayed, winRate, tier, isCurrent } =
    player;

  // Tier description for tooltip
  let tierDesc = '';
  switch (tier) {
    case 'Diamond':
      tierDesc = 'Diamond Tier: Top 1% of players.';
      break;
    case 'Platinum':
      tierDesc = 'Platinum Tier: Top 2–5%.';
      break;
    case 'Gold':
      tierDesc = 'Gold Tier: Top 6–15%.';
      break;
    case 'Silver':
      tierDesc = 'Silver Tier: Top 16–30%.';
      break;
    case 'Bronze':
      tierDesc = 'Bronze Tier: Top 31–50%.';
      break;
    default:
      tierDesc = '';
  }

  // Row styling
  const rowClass = isCurrent
    ? 'current-row bg-hover-bg border-l-4 border-accent-yellow font-bold text-text-primary cursor-pointer motion-safe:transition-colors duration-150 motion-reduce:!transform-none'
    : 'hover:bg-hover-bg cursor-pointer motion-safe:transition-colors duration-150 motion-reduce:!transform-none';

  return (
    <MotionTr
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={m.fast}
      className={rowClass}
      onClick={() => onClick?.(player)}
    >
      <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-accent-yellow">
        {rank}
      </td>
      <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-3">
        <Image
          src={avatar}
          alt={username}
          width={40}
          height={40}
          className={`h-10 w-10 rounded-full ${
            isCurrent
              ? 'border-2 border-accent-yellow'
              : 'border-2 border-transparent'
          }`}
        />
        <span>
          {username}
          {isCurrent ? ' (You)' : ''}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-accent-green">
        $
        {winnings.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
        {gamesPlayed}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
        {winRate}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
        <Tooltip text={tierDesc}>
          <span className="underline decoration-dotted underline-offset-2">
            {tier}
          </span>
        </Tooltip>
      </td>
    </MotionTr>
  );
}

export default memo(LeaderboardTableRow);
