'use client';

import { useEffect, useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/app/utils/socket';
import type { Message } from '@/app/components/common/chat/types';
import { env } from '@/lib/env';

export type ChatStatus = 'connecting' | 'connected' | 'error';

export default function useChatSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ChatStatus>(
    env.IS_E2E ? 'connected' : 'connecting',
  );
  const [queryError, setQueryError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const pendingTimers = useRef(
    new Map<number, ReturnType<typeof setTimeout>>(),
  );
  const lastMessageId = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      pendingTimers.current.forEach((t) => clearTimeout(t));
      pendingTimers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (env.IS_E2E) return;

    const s = getSocket({
      onConnect: () => setStatus('connected'),
      onDisconnect: () => setStatus('connecting'),
      onError: () => setStatus('error'),
    });

    const onReconnectAttempt = () => setStatus('connecting');
    const onReconnectError = () => setStatus('error');

    s.io.on('reconnect_attempt', onReconnectAttempt);
    s.io.on('reconnect_error', onReconnectError);

    setSocket(s);

    return () => {
      s.io.off('reconnect_attempt', onReconnectAttempt);
      s.io.off('reconnect_error', onReconnectError);
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg: Message) => {
      queryClient.setQueryData<Message[]>(['chat', 'messages'], (prev = []) => {
        const existing = prev.find((m) => m.id === msg.id);
        if (existing) {
          return prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m));
        }
        return [...prev, msg];
      });
    };

    const handleAck = ({ id }: { id: number }) => {
      queryClient.setQueryData<Message[]>(['chat', 'messages'], (prev = []) =>
        prev.map((m) => (m.id === id ? { ...m, pending: false } : m)),
      );
      const timer = pendingTimers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        pendingTimers.current.delete(id);
      }
    };

    socket.on('message', handleMessage);
    socket.on('message:ack', handleAck);
    return () => {
      socket.off('message', handleMessage);
      socket.off('message:ack', handleAck);
    };
  }, [socket, queryClient]);

  const messagesQuery = useQuery<Message[], Error>({
    queryKey: ['chat', 'messages'],
    enabled: !!socket,
    queryFn: () =>
      new Promise<Message[]>((resolve, reject) => {
        if (!socket) {
          resolve([]);
          return;
        }
        const handleHistory = (history: Message[]) => {
          resolve(history);
        };
        const handleError = (err: unknown) => {
          reject(err instanceof Error ? err : new Error('Socket error'));
        };
        socket.once('history', handleHistory);
        socket.once('error', handleError);
      }),
  });

  useEffect(() => {
    if (messagesQuery.error) setQueryError(messagesQuery.error);
  }, [messagesQuery.error]);

  const sendMessageMutation = useMutation<
    void,
    unknown,
    string,
    { previous?: Message[]; id?: number }
  >({
    mutationFn: async (text: string) => {
      const id = lastMessageId.current;
      const trimmed = text.trim();
      if (!socket || !id || !trimmed) return;
      socket.emit('message', { id, text: trimmed });
    },
    onMutate: async (text: string) => {
      await queryClient.cancelQueries({ queryKey: ['chat', 'messages'] });
      const trimmed = text.trim();
      if (!trimmed) {
        lastMessageId.current = null;
        return {
          previous:
            queryClient.getQueryData<Message[]>(['chat', 'messages']) ?? [],
        };
      }
      const id = Date.now();
      lastMessageId.current = id;
      const time = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const optimistic: Message = {
        id,
        sender: 'player',
        text: trimmed,
        time,
        pending: true,
      };
      const previous =
        queryClient.getQueryData<Message[]>(['chat', 'messages']) ?? [];
      queryClient.setQueryData<Message[]>(
        ['chat', 'messages'],
        [...previous, optimistic],
      );
      const timer = setTimeout(() => {
        queryClient.setQueryData<Message[]>(['chat', 'messages'], (prev = []) =>
          prev.map((m) =>
            m.id === id ? { ...m, pending: false, error: true } : m,
          ),
        );
        pendingTimers.current.delete(id);
      }, 5000);
      pendingTimers.current.set(id, timer);
      return { previous, id };
    },
    onError: (_err, _text, ctx) => {
      if (ctx?.previous)
        queryClient.setQueryData(['chat', 'messages'], ctx.previous);
      if (ctx?.id) {
        const timer = pendingTimers.current.get(ctx.id);
        if (timer) {
          clearTimeout(timer);
          pendingTimers.current.delete(ctx.id);
        }
      }
    },
    onSettled: () => {
      lastMessageId.current = null;
    },
  });

  const retryMessage = (id: number) => {
    const msgs = queryClient.getQueryData<Message[]>(['chat', 'messages']);
    const msg = msgs?.find((m) => m.id === id);
    if (!msg) return;
    queryClient.setQueryData<Message[]>(['chat', 'messages'], (prev = []) =>
      prev.map((m) =>
        m.id === id ? { ...m, pending: true, error: false } : m,
      ),
    );
    socket?.emit('message', { id, text: msg.text });
    const timer = setTimeout(() => {
      queryClient.setQueryData<Message[]>(['chat', 'messages'], (prev = []) =>
        prev.map((m) =>
          m.id === id ? { ...m, pending: false, error: true } : m,
        ),
      );
      pendingTimers.current.delete(id);
    }, 5000);
    pendingTimers.current.set(id, timer);
  };

  return {
    socket,
    status,
    messages: messagesQuery.data ?? [],
    sendMessage: sendMessageMutation.mutate,
    retryMessage,
    error: queryError,
  } as const;
}
