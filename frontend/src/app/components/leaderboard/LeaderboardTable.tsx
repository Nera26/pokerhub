'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Tooltip from '../ui/Tooltip';
import useVirtualizedList from '@/hooks/useVirtualizedList';
import useRenderCount from '@/hooks/useRenderCount';

// Define filter types
export type TimeFilter = 'daily' | 'weekly' | 'monthly';
export type ModeFilter = 'cash' | 'tournament';

// Player data interface
export interface Player {
  id: number;
  username: string;
  avatar: string;
  winnings: number;
  gamesPlayed: number;
  winRate: number;
  tier: string;
  isCurrent: boolean;
  category: string; // e.g. 'daily-cash', 'weekly-tournament', etc.
}

interface LeaderboardTableProps {
  data: Player[];
  selectedTime: TimeFilter;
  selectedMode: ModeFilter;
  /** Called when a player row is clicked */
  onPlayerClick?: (player: Player) => void;
}

// Sort by winnings DESC, then winRate DESC, then gamesPlayed DESC
function sortPlayers(arr: Player[]) {
  return arr.sort((a, b) => {
    if (b.winnings !== a.winnings) return b.winnings - a.winnings;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.gamesPlayed - a.gamesPlayed;
  });
}

export default function LeaderboardTable({
  data,
  selectedTime,
  selectedMode,
  onPlayerClick,
}: LeaderboardTableProps) {
  useRenderCount('LeaderboardTable');
  const parentRef = useRef<HTMLDivElement>(null);

  // Compute filtered & sorted list
  const sorted = useMemo(() => {
    const categoryKey = `${selectedTime}-${selectedMode}`;
    const filtered = data.filter((p) => p.category === categoryKey);
    return sortPlayers(filtered.slice());
  }, [data, selectedTime, selectedMode]);

  const currentIdx = useMemo(
    () => sorted.findIndex((p) => p.isCurrent),
    [sorted],
  );

  const virtualizer = useVirtualizedList<HTMLDivElement>({
    count: sorted.length,
    parentRef,
    estimateSize: 64,
  });

  // Scroll current user into view if outside top 5
  useEffect(() => {
    if (currentIdx < 5) return;
    if (virtualizer.getVirtualItems().length > 0) {
      virtualizer.scrollToIndex(currentIdx, { align: 'center' });
    }
    const rows = parentRef.current?.querySelectorAll('tbody tr');
    rows?.[currentIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentIdx, virtualizer]);

  // If no players in this category
  if (sorted.length === 0) {
    return (
      <div className="text-center text-text-secondary py-6">
        You haven’t ranked yet. Play more to join the leaderboard!
      </div>
    );
  }
  const virtualRows = virtualizer.getVirtualItems();
  const useFallback = virtualRows.length === 0;
  const paddingTop = useFallback ? 0 : virtualRows[0].start;
  const paddingBottom = useFallback
    ? 0
    : virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end;

  const renderRow = (p: Player, index: number) => {
    const rank = index + 1;
    const isCurrent = p.isCurrent;
    const rowClass = isCurrent
      ? 'current-row bg-hover-bg border-l-4 border-accent-yellow font-bold text-text-primary border-b border-border-dark'
      : 'hover:bg-hover-bg transition-colors duration-150 cursor-pointer border-b border-border-dark';

    // Tier tooltip text
    let tierDesc = '';
    switch (p.tier) {
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

    return (
      <tr key={p.id} className={rowClass} onClick={() => onPlayerClick?.(p)}>
        <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-accent-yellow">
          {rank}
        </td>
        <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-3">
          <Image
            src={p.avatar}
            alt={p.username}
            width={40}
            height={40}
            loading="lazy"
            sizes="40px"
            className={`h-10 w-10 rounded-full border-2 ${isCurrent ? 'border-accent-yellow' : 'border-transparent'}`}
          />
          <span>
            {p.username}
            {isCurrent && ' (You)'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-accent-green">
          $
          {p.winnings.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
          {p.gamesPlayed}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
          {p.winRate}%
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
          <Tooltip text={tierDesc}>
            <span className="flex items-center space-x-1">
              {/* You could swap in icons here */}
              <span>{p.tier}</span>
            </span>
          </Tooltip>
        </td>
      </tr>
    );
  };

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <table className="min-w-full divide-y divide-border-dark">
        <thead className="bg-hover-bg">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
              Player
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
              Winnings
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
              Games Played
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
              Win Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
              Tier
            </th>
          </tr>
        </thead>
        <tbody>
          {paddingTop > 0 && !useFallback && (
            <tr className="border-none">
              <td colSpan={6} style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {useFallback
            ? sorted.map((p, i) => renderRow(p, i))
            : virtualRows.map((vr) => renderRow(sorted[vr.index], vr.index))}
          {paddingBottom > 0 && !useFallback && (
            <tr className="border-none">
              <td colSpan={6} style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
