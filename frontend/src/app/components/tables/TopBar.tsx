'use client';

import Button from '../ui/Button';
import PlayerChipStack from '../ui/PlayerChipStack';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import Image from 'next/image';

export interface TopBarProps {
  tableId: string | string[];
  smallBlind: number;
  bigBlind: number;
  handNumber: string;
  pingMs: number;
  youChips: number;
  headerAvatar: string;
  onGoBack: () => void;
  onSwitchTable: (index: number) => void;
  onAddNewTable: () => void;
  onLeave: () => void;
  onToggleSidePanel: () => void;
}

export default function TopBar({
  tableId,
  smallBlind,
  bigBlind,
  handNumber,
  pingMs,
  youChips,
  headerAvatar,
  onGoBack,
  onSwitchTable,
  onAddNewTable,
  onLeave,
  onToggleSidePanel,
}: TopBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-b border-border-color pt-[env(safe-area-inset-top)] sm:px-6 sm:py-4">
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        <button
          onClick={onGoBack}
          className="text-text-secondary hover:text-text-primary p-2"
          aria-label="Back"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
        </button>

        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-lg font-bold">
              Table #{Array.isArray(tableId) ? tableId.join('-') : tableId}
            </h1>
            <span className="text-xs text-text-secondary">
              NLH ${smallBlind}/{bigBlind}
            </span>
            <span className="text-xs text-text-secondary">
              Hand {handNumber}
            </span>
            <span className="text-xs text-text-secondary">Ping {pingMs}ms</span>
            <span className="text-xs text-text-secondary">Provably Fair</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 ml-0 md:ml-8">
          <Button variant="primary" onClick={() => onSwitchTable(1)}>
            Table 1
          </Button>
          <Button variant="ghost" onClick={() => onSwitchTable(2)}>
            <span className="relative">
              Table 2
              <span className="absolute -top-1 -right-2 inline-block w-2 h-2 rounded-full bg-accent-yellow animate-pulse" />
            </span>
          </Button>
          <Button
            variant="ghost"
            onClick={onAddNewTable}
            aria-label="Tile view"
          >
            ⧉
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-end">
        <Button variant="danger" onClick={onLeave}>
          Leave
        </Button>

        {/* HEADER: your stack with dark chip bar */}
        <PlayerChipStack amount={youChips} size="md" />

        <button
          className="text-text-secondary hover:text-text-primary p-2"
          onClick={onToggleSidePanel}
          aria-label="Toggle right rail"
        >
          <Image
            src={headerAvatar}
            alt="User"
            width={32}
            height={32}
            sizes="32px"
            className="w-8 h-8 rounded-full"
          />
        </button>
      </div>
    </div>
  );
}
