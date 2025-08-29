'use client';

import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  getGameSocket,
  disconnectGameSocket,
  sendAction,
  join,
  buyIn,
  sitOut,
  rebuy,
} from '@/lib/socket';

export default function useGameSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = getGameSocket();
    setSocket(s);
    return () => {
      disconnectGameSocket();
    };
  }, []);

  return { socket, sendAction, join, buyIn, sitout: sitOut, rebuy } as const;
}

