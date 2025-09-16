'use client';

import { useMutation } from '@tanstack/react-query';
import { sendBroadcast } from '@/lib/api/broadcasts';
import { useApiError } from '@/hooks/useApiError';
import { useBroadcastTypes } from '@/hooks/lookups';
import { useAdminMessages } from '@/hooks/useAdminMessageActions';
import AdminMessageList from './AdminMessageList';
import type { BroadcastType } from '@shared/types';
import { useState } from 'react';
import Link from 'next/link';

export default function BroadcastPanel() {
  const { data, isLoading, isError, error } = useAdminMessages();

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
      <div className="mb-4 space-y-2">
        <Link
          href="/admin/ctas"
          className="block w-full rounded-xl bg-accent-yellow py-2 text-center font-semibold text-black hover:brightness-110"
        >
          Manage CTAs
        </Link>
        <Link
          href="/admin/blocked-countries"
          className="block w-full rounded-xl bg-card-bg py-2 text-center font-semibold text-text-primary border border-border-dark hover:bg-hover-bg"
        >
          Manage Blocked Countries
        </Link>
      </div>
      <AdminMessageList
        messages={messages}
        isLoading={isLoading}
        isError={isError}
        error={error}
        renderMessage={(m) => (
          <div className="p-3 bg-primary-bg rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-accent-green rounded-full" />
              <span className="text-sm font-semibold">{m.sender}</span>
            </div>
            <p className="text-xs text-text-secondary">{m.preview}</p>
            <button className="text-accent-blue text-xs mt-1">Reply</button>
          </div>
        )}
      />
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
