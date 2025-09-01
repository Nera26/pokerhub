'use client';

import { useEffect, useState } from 'react';
import type { GameState } from '@shared/types';
import { EVENT_SCHEMA_VERSION } from '@shared/events';
import useGameSocket from '@/hooks/useGameSocket';
import Seats from './Seats';
import Board from './Board';
import ActionControls from './ActionControls';

interface PageProps {
  params: { id: string };
}

export default function TablePage({ params }: PageProps) {
  const tableId = params.id;
  const { socket, join, sendAction } = useGameSocket();
  const [state, setState] = useState<GameState | null>(null);
  const [status, setStatus] = useState('');
  const [lastActionId, setLastActionId] = useState<string | null>(null);

  const applyDelta = (target: any, delta: any): any => {
    if (!delta || typeof delta !== 'object') return delta;
    const result: any = Array.isArray(target) ? [...(target ?? [])] : { ...(target ?? {}) };
    for (const [key, value] of Object.entries(delta)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = applyDelta(result[key], value);
      } else {
        result[key] = value as any;
      }
    }
    return result;
  };

  // Join table and listen for state/ack/error events
  useEffect(() => {
    if (!socket) return;

    join()
      .then(() => setStatus('Joined table'))
      .catch((err) => setStatus(`Error: ${err.message}`));

    const handleState = (s: GameState & { version: string }) => {
      if (s.version !== EVENT_SCHEMA_VERSION) {
        setStatus('Protocol version mismatch');
        return;
      }
      setState(s);
    };
    const handleDelta = (d: { version: string; delta: Partial<GameState> }) => {
      if (d.version !== EVENT_SCHEMA_VERSION) {
        setStatus('Protocol version mismatch');
        return;
      }
      setState((prev) => applyDelta(prev, d.delta));
    };
    const handleAck = (
      ack: { actionId: string; duplicate?: boolean; version: string },
    ) => {
      if (ack.version !== EVENT_SCHEMA_VERSION) {
        setStatus('Protocol version mismatch');
        return;
      }
      if (ack.actionId === lastActionId) {
        setStatus(
          ack.duplicate
            ? 'Duplicate action acknowledged'
            : 'Action acknowledged',
        );
      }
    };
    const handleError = (msg: string) => setStatus(`Error: ${msg}`);

    socket.on('state', handleState);
    socket.on('action:ack', handleAck);
    socket.on('server:Error', handleError);
    socket.on('server:StateDelta', handleDelta);

    return () => {
      socket.off('state', handleState);
      socket.off('action:ack', handleAck);
      socket.off('server:Error', handleError);
      socket.off('server:StateDelta', handleDelta);
    };
  }, [socket, join, lastActionId]);

  const handleAction = (action: Record<string, unknown>) => {
    const actionId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Date.now().toString();
    setLastActionId(actionId);
    setStatus('Sending action...');
    sendAction({ ...action, actionId }).catch((err) =>
      setStatus(`Error: ${err.message}`),
    );
  };

  const players = ((state as any)?.players ?? []) as any[];
  const communityCards = ((state as any)?.communityCards ?? []) as string[];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Table {tableId}</h1>
      <Board cards={communityCards} />
      <Seats players={players} />
      <ActionControls onAction={handleAction} />
      {status && (
        <p data-testid="status" className="text-sm text-gray-700">
          {status}
        </p>
      )}
    </div>
  );
}

