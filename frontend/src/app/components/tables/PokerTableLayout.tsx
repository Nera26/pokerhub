'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar, { type TopBarTable } from './TopBar';
import ActionControls from './ActionControls';
import { getServerTime } from '@/lib/server-time';
import TableMain, { type TableMainHandle } from './TableMain';
import useBetting from '@/hooks/useBetting';
import useToasts from '@/hooks/useToasts';
import { useTableState } from '@/hooks/useTableState';
import { usePlayerTables } from '@/hooks/usePlayerTables';
import type { Player } from './types';
import { calculateSidePots } from '@shared/poker/sidePots';

export interface ChatMessage {
  id: number;
  username: string;
  avatar: string;
  text: string;
  time: string;
}

export interface PokerTableLayoutProps {
  tableId: string | string[];
  smallBlind: number;
  bigBlind: number;
  pot?: number;
  communityCards?: string[];
  players?: Player[];
  heroId?: Player['id'];
  heroUsername?: Player['username'];
  chatMessages?: ChatMessage[];
  handNumber?: string;
  pingMs?: number;
  onGoBack?: () => void;
  onSwitchTable?: (tableId: string) => void;
  onAddNewTable?: () => void;
  onToggleSound?: () => void;
  onSitOut?: () => void;
  onLeave?: () => void;
}

export default function PokerTableLayout({
  tableId,
  smallBlind,
  bigBlind,
  pot: basePot = 0,
  communityCards = [],
  players = [],
  heroId,
  heroUsername,
  chatMessages = [],
  handNumber,
  pingMs,
  onGoBack,
  onSwitchTable,
  onAddNewTable = () => {},
  onToggleSound = () => {},
  onSitOut = () => {},
  onLeave = () => {},
}: PokerTableLayoutProps) {
  const router = useRouter();
  const activeTableId = Array.isArray(tableId) ? tableId[0] : tableId;

  const { data: tableState } = useTableState(activeTableId);
  const { data: playerTables } = usePlayerTables();
  const sessions = playerTables ?? [];
  const currentSession = sessions.find(
    (session) => session.tableId === activeTableId,
  );

  const topBarTables: TopBarTable[] = sessions.map((session, index) => ({
    id: session.tableId,
    label: session.label ?? session.name ?? `Table ${index + 1}`,
    requiresAttention: session.requiresAction ?? false,
  }));

  if (
    activeTableId &&
    !topBarTables.some((table) => table.id === activeTableId)
  ) {
    topBarTables.unshift({
      id: activeTableId,
      label:
        currentSession?.label ??
        currentSession?.name ??
        (activeTableId ? `Table ${activeTableId}` : 'Current Table'),
      requiresAttention: currentSession?.requiresAction ?? false,
    });
  }

  const derivedHandNumber =
    tableState?.handId ?? handNumber ?? currentSession?.handId;
  const derivedPingMs = pingMs ?? currentSession?.pingMs;

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      router.back();
    }
  };

  const handleSwitchTable = (nextTableId: string) => {
    if (!nextTableId) return;
    if (onSwitchTable) {
      onSwitchTable(nextTableId);
    } else {
      router.push(`/table/${nextTableId}`);
    }
  };
  const {
    hero,
    youChips,
    currentBet,
    callAmount,
    street,
    pot: potNow,
    minTotal,
    maxTotal,
    effective,
    raiseTotal,
    setRaiseTotal,
  } = useBetting({
    players,
    communityCards,
    pot: basePot,
    bigBlind,
    heroId,
    heroUsername,
  });

  const [autoCheckFold, setAutoCheckFold] = useState(false);
  const [autoFoldAny, setAutoFoldAny] = useState(false);
  const [autoCallAny, setAutoCallAny] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { toasts, pushToast } = useToasts();

  const tableRef = useRef<TableMainHandle>(null);

  const headerAvatar =
    players?.[0]?.avatar ??
    'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

  const density: 'compact' | 'default' | 'large' =
    players.length <= 4 ? 'large' : players.length <= 6 ? 'compact' : 'default';
  const { main: mainPot, sidePots } = calculateSidePots(players, potNow);

  return (
    <div className="bg-primary-bg text-text-primary min-h-screen">
      <TopBar
        currentTableId={activeTableId ?? ''}
        tables={topBarTables}
        smallBlind={smallBlind}
        bigBlind={bigBlind}
        handNumber={derivedHandNumber}
        pingMs={derivedPingMs}
        youChips={youChips}
        headerAvatar={headerAvatar}
        onGoBack={handleGoBack}
        onSwitchTable={handleSwitchTable}
        onAddNewTable={onAddNewTable}
        onLeave={onLeave}
        onToggleSidePanel={() => tableRef.current?.toggleSidePanel()}
      />

      {/* Toasts */}
      <div
        className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-50 space-y-2"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={
              'px-3 py-1 text-sm rounded-xl shadow-md border ' +
              (t.variant === 'error'
                ? 'bg-danger-red text-white border-danger-red'
                : t.variant === 'success'
                  ? 'bg-accent-green text-white border-accent-green'
                  : 'bg-card-bg/90 border-border-dark')
            }
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Table and side panel */}
      <TableMain
        ref={tableRef}
        players={players}
        communityCards={communityCards}
        pot={mainPot}
        sidePots={sidePots}
        street={street}
        density={density}
        handNumber={handNumber}
        soundEnabled={soundEnabled}
        chatMessages={chatMessages}
        tableId={Array.isArray(tableId) ? tableId[0] : tableId}
        heroId={heroId ?? ''}
        onSendMessage={(text) => pushToast(`You: ${text}`)}
        onToggleSound={() => {
          setSoundEnabled((s) => !s);
          onToggleSound();
        }}
        onSitOut={onSitOut}
        onLeave={onLeave}
        onReplay={(hand) => pushToast(`Replay hand ${hand}`)}
      />

      {/* Action bar */}
      <ActionControls
        currentBet={currentBet}
        callAmount={callAmount}
        pot={potNow}
        effective={effective}
        bigBlind={bigBlind}
        minTotal={minTotal}
        maxTotal={maxTotal}
        sliderTotal={raiseTotal}
        onSliderChange={setRaiseTotal}
        onFold={() => pushToast('You folded')}
        onCheck={() => pushToast('You checked')}
        onCall={() => pushToast(`You called $${callAmount}`)}
        onRaiseTo={(total) =>
          pushToast(
            `${currentBet === 0 ? 'You bet' : 'You raised to'} $${total}`,
          )
        }
        isHeroTurn={!!hero?.isActive}
        turnDeadline={
          hero?.isActive && hero?.timeLeft != null
            ? getServerTime() + hero.timeLeft
            : undefined
        }
        autoCheckFold={autoCheckFold}
        onToggleAutoCheckFold={setAutoCheckFold}
        autoFoldAny={autoFoldAny}
        onToggleAutoFoldAny={setAutoFoldAny}
        autoCallAny={autoCallAny}
        onToggleAutoCallAny={setAutoCallAny}
      />
    </div>
  );
}
