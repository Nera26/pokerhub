'use client';

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import type { AdminMessage } from '@shared/types';
import type { ApiError } from '@/lib/api/client';

interface Props {
  messages: AdminMessage[];
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;
  renderMessage: (m: AdminMessage) => React.ReactNode;
  pageSize?: number;
}

export default function AdminMessageList({
  messages,
  isLoading,
  isError,
  error,
  renderMessage,
  pageSize = 6,
}: Props) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [messages]);

  if (isLoading) {
    return <div className="px-6 py-4 text-center">Loading messages...</div>;
  }

  if (isError) {
    return (
      <div
        className="px-6 py-4 bg-danger-red text-white rounded-xl"
        role="alert"
      >
        {error?.message || 'Failed to load messages'}
      </div>
    );
  }

  const total = messages.length;
  if (total === 0) {
    return (
      <div className="px-6 py-4 text-center text-text-secondary">
        No messages.
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, total);
  const pageItems = messages.slice(startIdx, endIdx);

  return (
    <div>
      <div className="divide-y divide-dark">
        {pageItems.map((m) => (
          <div key={m.id}>{renderMessage(m)}</div>
        ))}
      </div>
      <div className="bg-primary-bg px-6 py-4 flex items-center justify-between">
        <p className="text-text-secondary text-sm">
          Showing {endIdx} of {total} messages
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="bg-card-bg border border-dark px-3 py-2 rounded-lg text-sm font-semibold"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="chipYellow"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
