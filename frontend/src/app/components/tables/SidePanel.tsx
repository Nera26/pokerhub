'use client';

import { useState, type KeyboardEvent, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { faVolumeHigh } from '@fortawesome/free-solid-svg-icons/faVolumeHigh';
import { faPause } from '@fortawesome/free-solid-svg-icons/faPause';
import { faDoorOpen } from '@fortawesome/free-solid-svg-icons/faDoorOpen';
import Input from '../ui/Input';
import Button from '../ui/Button';
import type { ChatMessage } from './PokerTableLayout';
import useSocket from '@/hooks/useSocket';
import {
  sendChatMessage,
  fetchTableHands,
  fetchSidePanelTabs,
  type HandSummary,
  type TabKey,
} from '@/lib/api/table';

export interface SidePanelProps {
  isOpen: boolean;
  tableId: string;
  heroId: string;
  chatMessages: ChatMessage[];
  onSendMessage?: (text: string) => void;
  onToggleSound: () => void;
  onSitOut: () => void;
  onLeave: () => void;
  onReplay?: (handId: string) => void;
}

export default function SidePanel({
  isOpen,
  tableId,
  heroId,
  chatMessages,
  onSendMessage,
  onToggleSound,
  onSitOut,
  onLeave,
  onReplay,
}: SidePanelProps) {
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<TabKey>('history');
  const [messages, setMessages] = useState(chatMessages);
  const socket = useSocket('game');

  const {
    data: hands,
    isLoading: handsLoading,
    isError: handsError,
  } = useQuery<HandSummary[]>({
    queryKey: ['table-hands', tableId],
    queryFn: () => fetchTableHands(tableId),
    enabled: !!tableId,
  });

  const { data: tabs = [] } = useQuery<TabKey[]>({
    queryKey: ['table-tabs', tableId],
    queryFn: () => fetchSidePanelTabs(tableId),
    enabled: !!tableId,
  });

  useEffect(() => {
    if (tabs.length && !tabs.includes(tab)) {
      setTab(tabs[0]);
    }
  }, [tabs, tab]);

  useEffect(() => {
    setMessages(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    if (!socket) return;
    const handle = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on('chat:message', handle);
    return () => {
      socket.off('chat:message', handle);
    };
  }, [socket]);

  const switchTab = (key: TabKey) => {
    setTab(key);
    document.getElementById(`${key}-tab`)?.focus();
  };
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!tabs.length) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const idx = tabs.indexOf(tab);
      const next = tabs[(idx + dir + tabs.length) % tabs.length];
      switchTab(next);
    }
  };

  const send = async () => {
    const t = input.trim();
    if (!t) return;
    await sendChatMessage(tableId, { userId: heroId, text: t });
    onSendMessage?.(t);
    setInput('');
  };

  return (
    <div
      className={`fixed right-0 top-0 h-full w-full sm:w-80 bg-card-bg border-l border-border-dark transform transition-transform duration-200 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Tabs */}
      <div className="px-4 pt-4">
        <div
          className="flex gap-2 mb-3"
          role="tablist"
          aria-label="Side panel tabs"
        >
          {tabs.includes('history') && (
            <button
              id="history-tab"
              role="tab"
              aria-selected={tab === 'history'}
              aria-controls="history-panel"
              className={`px-3 py-1 rounded-xl text-sm border ${
                tab === 'history'
                  ? 'border-accent-yellow text-accent-yellow'
                  : 'border-border-dark text-text-secondary'
              }`}
              onClick={() => switchTab('history')}
              onKeyDown={onTabKey}
            >
              Hand History
            </button>
          )}
          {tabs.includes('chat') && (
            <button
              id="chat-tab"
              role="tab"
              aria-selected={tab === 'chat'}
              aria-controls="chat-panel"
              className={`px-3 py-1 rounded-xl text-sm border ${
                tab === 'chat'
                  ? 'border-accent-yellow text-accent-yellow'
                  : 'border-border-dark text-text-secondary'
              }`}
              onClick={() => switchTab('chat')}
              onKeyDown={onTabKey}
            >
              Chat
            </button>
          )}
          {tabs.includes('notes') && (
            <button
              id="notes-tab"
              role="tab"
              aria-selected={tab === 'notes'}
              aria-controls="notes-panel"
              className={`px-3 py-1 rounded-xl text-sm border ${
                tab === 'notes'
                  ? 'border-accent-yellow text-accent-yellow'
                  : 'border-border-dark text-text-secondary'
              }`}
              onClick={() => switchTab('notes')}
              onKeyDown={onTabKey}
            >
              Notes
            </button>
          )}
        </div>
      </div>

      {/* Hand History (default) */}
      {tab === 'history' && tabs.includes('history') && (
        <div
          id="history-panel"
          role="tabpanel"
          aria-labelledby="history-tab"
          className="p-4 text-sm text-text-secondary space-y-2"
        >
          {handsLoading && (
            <div className="text-xs text-text-secondary">Loading hands...</div>
          )}
          {handsError && (
            <div className="text-xs text-text-secondary">
              Failed to load hands.
            </div>
          )}
          {hands && hands.length > 0
            ? hands.map((hand) => (
                <div key={hand.id} className="space-y-1">
                  <div className="font-semibold text-text-primary">
                    Hand #{hand.id}
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-3"
                    onClick={() => onReplay?.(hand.id)}
                  >
                    Replay hand
                  </Button>
                </div>
              ))
            : !handsLoading &&
              !handsError && (
                <div className="text-xs text-text-secondary">No hands yet.</div>
              )}
        </div>
      )}

      {/* Chat */}
      {tab === 'chat' && tabs.includes('chat') && (
        <div
          id="chat-panel"
          role="tabpanel"
          aria-labelledby="chat-tab"
          className="h-[calc(100%-210px)] p-4 border-t border-border-dark flex flex-col"
        >
          <div className="flex-1 overflow-y-auto space-y-2 text-sm mb-4">
            {messages.map((msg) => (
              <div key={msg.id} className="text-text-secondary">
                <span className="text-accent-yellow font-semibold">
                  {msg.username}:
                </span>{' '}
                {msg.text}
                <div className="text-xs text-text-secondary">{msg.time}</div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-xs text-text-secondary">
                No messages yet.
              </div>
            )}
          </div>

          <div className="relative">
            <Input
              placeholder="Type message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
            />
            <button
              onClick={send}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-yellow hover:text-accent-blue"
              aria-label="Send message"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      )}

      {/* Notes */}
      {tab === 'notes' && tabs.includes('notes') && (
        <div
          id="notes-panel"
          role="tabpanel"
          aria-labelledby="notes-tab"
          className="p-4 text-sm text-text-secondary"
        >
          <p>Add player notes here.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 border-t border-border-dark">
        <h3 className="font-bold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={onToggleSound}
          >
            <FontAwesomeIcon icon={faVolumeHigh} className="mr-2" /> Sound
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={onSitOut}
          >
            <FontAwesomeIcon icon={faPause} className="mr-2" /> Sit out next BB
          </Button>
          <Button
            variant="danger"
            className="w-full justify-start"
            onClick={onLeave}
          >
            <FontAwesomeIcon icon={faDoorOpen} className="mr-2" /> Leave table
          </Button>
        </div>
      </div>
    </div>
  );
}
