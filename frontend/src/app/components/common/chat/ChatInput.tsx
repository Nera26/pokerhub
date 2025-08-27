'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  sendMessage: () => void;
  disabled: boolean;
}

export default function ChatInput({
  input,
  setInput,
  handleKeyDown,
  sendMessage,
  disabled,
}: ChatInputProps) {
  return (
    <div className="p-4 border-t border-border-dark">
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Connecting...' : 'Type your message...'}
          disabled={disabled}
          className="flex-grow bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow text-sm disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={disabled || !input.trim()}
          aria-label={disabled ? 'Connecting...' : 'Send message'}
          title={disabled ? 'Connecting...' : 'Send message'}
          className="bg-accent-green text-text-primary px-4 py-3 rounded-xl hover:brightness-110 hover-glow-green disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent-green"
        >
          {disabled ? 'Connecting...' : <FontAwesomeIcon icon={faPaperPlane} />}
        </button>
      </div>
    </div>
  );
}
