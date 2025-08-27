'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import dynamic from 'next/dynamic';

const SeatRing = dynamic(() => import('./SeatRing'), {
  loading: () => <div className="flex-1" aria-label="Loading table" />,
});
const SidePanel = dynamic(() => import('./SidePanel'), {
  loading: () => <div className="w-64" aria-label="Loading side panel" />,
});
import type { Player } from './types';
import type { ChatMessage } from './PokerTableLayout';

export interface TableMainProps {
  players: Player[];
  communityCards: string[];
  pot: number;
  sidePots: number[];
  street: 'pre' | 'flop' | 'turn' | 'river';
  density: 'compact' | 'default' | 'large';
  handNumber: string;
  soundEnabled: boolean;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onToggleSound: () => void;
  onSitOut: () => void;
  onLeave: () => void;
  onReplay: (hand: string) => void;
}

export interface TableMainHandle {
  toggleSidePanel: () => void;
}

const TableMain = forwardRef<TableMainHandle, TableMainProps>(
  function TableMain(
    {
      players,
      communityCards,
      pot,
      sidePots,
      street,
      density,
      handNumber,
      soundEnabled,
      chatMessages,
      onSendMessage,
      onToggleSound,
      onSitOut,
      onLeave,
      onReplay,
    },
    ref,
  ) {
    const [sideOpen, setSideOpen] = useState(true);
    useImperativeHandle(ref, () => ({
      toggleSidePanel: () => setSideOpen((s) => !s),
    }));

    return (
      <main id="main-content" className="flex flex-col md:flex-row gap-4 p-4">
        <SeatRing
          players={players}
          communityCards={communityCards}
          pot={pot}
          sidePots={sidePots}
          street={street}
          density={density}
          handNumber={handNumber}
          soundEnabled={soundEnabled}
        />

        <SidePanel
          isOpen={sideOpen}
          chatMessages={chatMessages}
          onSendMessage={onSendMessage}
          onToggleSound={onToggleSound}
          onSitOut={onSitOut}
          onLeave={onLeave}
          onReplay={onReplay}
        />
      </main>
    );
  },
);

export default TableMain;
