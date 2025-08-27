'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments } from '@fortawesome/free-solid-svg-icons/faComments';
import ChatHeader from './ChatHeader';
import ChatLog from './ChatLog';
import ChatInput from './ChatInput';
import type { Message } from './types';

interface ChatContainerProps {
  open: boolean;
  unreadCount: number;
  toggleOpen: () => void;
  status: 'connecting' | 'connected' | 'error';
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  sendMessage: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  chatRef: React.MutableRefObject<HTMLDivElement | null>;
  retryMessage: (id: number) => void;
}

export default function ChatContainer({
  open,
  unreadCount,
  toggleOpen,
  status,
  messages,
  input,
  setInput,
  sendMessage,
  handleKeyDown,
  chatRef,
  retryMessage,
}: ChatContainerProps) {
  return (
    <div className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-50">
      <button
        onClick={toggleOpen}
        aria-label={open ? 'Close chat' : 'Open chat'}
        title={open ? 'Close chat' : 'Open chat'}
        className="bg-accent-yellow text-primary-bg rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover-glow-yellow relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-yellow"
      >
        <FontAwesomeIcon icon={faComments} className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger-red text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute bottom-20 right-0 w-80 h-[400px] bg-card-bg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border-dark">
          <ChatHeader onClose={toggleOpen} />
          {status !== 'connected' && (
            <div
              role="status"
              aria-live="polite"
              className="bg-danger-red text-white text-center text-xs py-1"
            >
              {status === 'error' ? 'Connection lost' : 'Connecting...'}
            </div>
          )}
          <ChatLog
            messages={messages}
            chatRef={chatRef}
            retryMessage={retryMessage}
          />
          <ChatInput
            input={input}
            setInput={setInput}
            handleKeyDown={handleKeyDown}
            sendMessage={sendMessage}
            disabled={status !== 'connected'}
          />
        </div>
      )}
    </div>
  );
}
