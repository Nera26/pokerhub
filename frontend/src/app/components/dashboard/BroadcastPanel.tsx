'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchMessages } from '@/lib/api/messages';
import { sendBroadcast } from '@/lib/api/broadcasts';
import { useApiError } from '@/hooks/useApiError';
import useBroadcastTypes from '@/hooks/useBroadcastTypes';
import type { BroadcastType } from '@shared/types';
import { useState } from 'react';
import Link from 'next/link';

export default function BroadcastPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: fetchMessages,
  });

  const { data: typesData } = useBroadcastTypes();
  const types = typesData?.types ?? {};

  const [text, setText] = useState('');
  const [type, setType] = useState<BroadcastType>('announcement');
  const {
    mutate: broadcast,
    isLoading: isSending,
    error: sendError,
  } = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: () => setText(''),
  });

  useApiError(error || sendError);

  const messages = data?.messages ?? [];

  return (
    <>
      <Link
        href="/admin/ctas"
        className="block w-full bg-accent-yellow hover:brightness-110 text-black py-2 rounded-xl font-semibold text-center mb-4"
      >
        Manage CTAs
      </Link>
      {isLoading ? (
        <div>Loading messages...</div>
      ) : error ? (
        <div className="text-danger-red">Failed to load messages</div>
      ) : messages.length === 0 ? (
        <div className="text-text-secondary">No messages.</div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="p-3 bg-primary-bg rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-accent-green rounded-full" />
                <span className="text-sm font-semibold">{m.sender}</span>
              </div>
              <p className="text-xs text-text-secondary">{m.preview}</p>
              <button className="text-accent-blue text-xs mt-1">Reply</button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as BroadcastType)}
          className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
        >
          {(Object.keys(types) as BroadcastType[]).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Broadcast message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
        />
        {sendError && (
          <div className="text-danger-red text-sm">
            Failed to send broadcast
          </div>
        )}
        <button
          onClick={() => broadcast({ text, type })}
          disabled={isSending || text === ''}
          className="w-full bg-accent-yellow hover:brightness-110 text-black py-2 rounded-xl font-semibold disabled:opacity-50"
        >
          {isSending ? 'Sending...' : 'Send Broadcast'}
        </button>
      </div>
    </>
  );
}
