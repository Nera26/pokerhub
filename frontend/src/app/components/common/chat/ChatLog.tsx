'use client';

import type { Message } from './types';
import VirtualizedList from '@/components/VirtualizedList';

interface ChatLogProps {
  messages: Message[];
  chatRef: React.MutableRefObject<HTMLDivElement | null>;
  retryMessage: (id: number) => void;
}

export default function ChatLog({
  messages,
  chatRef,
  retryMessage,
}: ChatLogProps) {
  return (
    <VirtualizedList
      ref={chatRef}
      items={messages}
      estimateSize={80}
      className="flex-grow p-4 overflow-y-auto"
      role="log"
      aria-live="polite"
      renderItem={(msg, style, index) => {
        const bubbleClasses =
          msg.sender === 'player'
            ? 'bg-accent-blue text-text-primary'
            : 'bg-hover-bg text-text-secondary';
        return (
          <li
            key={msg.id}
            data-index={index}
            className={`${
              msg.sender === 'player' ? 'flex justify-end' : 'flex'
            } pb-3`}
            style={style}
          >
            <div className={`${bubbleClasses} p-3 rounded-lg max-w-[80%]`}>
              <p className="text-sm">{msg.text}</p>
              <p
                className={`text-xs mt-1 text-right ${
                  msg.sender === 'player' ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {msg.sender === 'player' ? 'You' : 'Admin'} – {msg.time}
                {msg.pending && ' (sending...)'}
                {msg.error && (
                  <span className="ml-1 text-danger-red">
                    (failed)
                    <button
                      type="button"
                      onClick={() => retryMessage(msg.id)}
                      className="ml-1 underline"
                    >
                      Retry
                    </button>
                  </span>
                )}
              </p>
            </div>
          </li>
        );
      }}
    />
  );
}
