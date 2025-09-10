'use client';

import { useState, useRef, useEffect } from 'react';
import ChatContainer from './ChatContainer';
import useChatSocket from '@/hooks/useChatSocket';
import type { Message } from './types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  message: z.string().trim().min(1),
});

type FormData = z.infer<typeof schema>;

interface ChatWidgetProps {
  messages?: Message[];
  onSend?: (text: string) => void;
}

export default function ChatWidget(_props: ChatWidgetProps = {}) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { status, messages, sendMessage, retryMessage } = useChatSocket();

  const chatRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  const prevLengthRef = useRef(0);

  const { handleSubmit, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { message: '' },
  });
  const input = watch('message');

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!openRef.current && messages.length > prevLengthRef.current) {
      setUnreadCount((c) => c + (messages.length - prevLengthRef.current));
    }
    prevLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  const toggleOpen = () => {
    setOpen((o) => !o);
    if (!open) setUnreadCount(0);
  };

  const onSubmit = ({ message }: FormData) => {
    sendMessage(message);
    reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <ChatContainer
      open={open}
      unreadCount={unreadCount}
      toggleOpen={toggleOpen}
      status={status}
      messages={messages}
      input={input}
      setInput={(val) => setValue('message', val)}
      sendMessage={handleSubmit(onSubmit)}
      handleKeyDown={handleKeyDown}
      chatRef={chatRef}
      retryMessage={retryMessage}
    />
  );
}
