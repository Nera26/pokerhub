'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/app/utils/socket';

interface AckPayload {
  actionId: string;
  duplicate?: boolean;
}

interface PendingAction {
  event: string;
  payload: Record<string, unknown>;
  ackEvent: string;
}

export default function useGameSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const pending = useRef<PendingAction | null>(null);
  const lastTick = useRef(0);

  useEffect(() => {
    const s = getSocket({ namespace: 'game' });
    setSocket(s);
    const handleState = (state: { tick?: number }) => {
      if (typeof state.tick === 'number') {
        lastTick.current = state.tick;
      }
    };
    const handleConnect = () => {
      if (pending.current) {
        s.emit(pending.current.event, pending.current.payload);
      }
      s.emit('resume', { tick: lastTick.current });
    };
    s.on('connect', handleConnect);
    s.on('state', handleState);
    return () => {
      s.off('connect', handleConnect);
      s.off('state', handleState);
      disconnectSocket('game');
    };
  }, []);

  const emitWithAck = useCallback(
    (event: string, payload: Record<string, unknown>, ackEvent: string) => {
      if (!socket) return Promise.reject(new Error('socket not connected'));
      const actionId =
        (payload.actionId as string | undefined) ??
        (typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Date.now().toString());
      const fullPayload = { ...payload, actionId };
      if (event === 'action') {
        pending.current = { event, payload: fullPayload, ackEvent };
      }
      return new Promise<void>((resolve) => {
        const handler = (ack: AckPayload) => {
          if (ack.actionId === actionId) {
            socket.off(ackEvent, handler);
            if (pending.current?.payload.actionId === actionId) {
              pending.current = null;
            }
            resolve();
          }
        };
        socket.on(ackEvent, handler);
        socket.emit(event, fullPayload);
      });
    },
    [socket],
  );

  const sendAction = useCallback(
    (action: Record<string, unknown>) =>
      emitWithAck('action', action, 'action:ack'),
    [emitWithAck],
  );

  const join = useCallback(() => emitWithAck('join', {}, 'join:ack'), [emitWithAck]);
  const buyIn = useCallback(
    () => emitWithAck('buy-in', {}, 'buy-in:ack'),
    [emitWithAck],
  );
  const sitout = useCallback(
    () => emitWithAck('sitout', {}, 'sitout:ack'),
    [emitWithAck],
  );
  const rebuy = useCallback(
    () => emitWithAck('rebuy', {}, 'rebuy:ack'),
    [emitWithAck],
  );

  return { socket, sendAction, join, buyIn, sitout, rebuy } as const;
}

