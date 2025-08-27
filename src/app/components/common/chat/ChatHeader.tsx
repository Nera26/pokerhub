'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';

interface ChatHeaderProps {
  onClose: () => void;
}

export default function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="p-4 bg-hover-bg flex justify-between items-center">
      <h3 className="text-text-primary font-semibold">Support Chat</h3>
      <button
        onClick={onClose}
        aria-label="Close chat"
        title="Close chat"
        className="text-text-secondary hover:text-accent-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
}
