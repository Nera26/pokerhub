'use client';

import { useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

export default function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('/ws/chat');
    socketRef.current = ws;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as ChatMessage;
        setMessages((prev) => [...prev, data]);
      } catch {
        // ignore malformed messages
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
      ws.close();
    };
  }, []);

  const send = (text: string) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ text }));
  };

  return { messages, send } as const;
}
