'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMessages } from '@/lib/api/messages';
import { useApiError } from '@/hooks/useApiError';

export default function BroadcastPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: fetchMessages,
  });

  useApiError(error);

  const messages = data?.messages ?? [];

  return (
    <>
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
        <input
          type="text"
          placeholder="Broadcast message..."
          className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
        />
        <button className="w-full bg-accent-yellow hover:brightness-110 text-black py-2 rounded-xl font-semibold">
          Send Broadcast
        </button>
      </div>
    </>
  );
}
