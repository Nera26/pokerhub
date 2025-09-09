'use client';

import { useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/app/utils/socket';

interface Callbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: Error) => void;
}

export default function useSocket(
  namespace: string,
  { onConnect, onDisconnect, onError }: Callbacks = {},
) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = getSocket({ namespace, onConnect, onDisconnect, onError });
    setSocket(s);
    return () => {
      disconnectSocket(namespace);
    };
  }, [namespace, onConnect, onDisconnect, onError]);

  return socket;
}
