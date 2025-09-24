'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchBroadcasts,
  fetchBroadcastTemplates,
  sendBroadcast,
} from '@/lib/api/broadcasts';
import { useApiError } from '@/hooks/useApiError';
import { useBroadcastTypes } from '@/hooks/lookups';
import {
  useAdminMessages,
  useMarkMessageRead,
} from '@/hooks/useAdminMessageActions';
import AdminMessageList from './AdminMessageList';
import type {
  BroadcastTemplatesResponse,
  BroadcastType,
  BroadcastsResponse,
} from '@shared/types';
import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function BroadcastPanel() {
  const { data, isLoading, isError, error } = useAdminMessages();
  const { mutate: markMessageRead } = useMarkMessageRead();

  const { data: typesData } = useBroadcastTypes();
  const types = typesData?.types ?? {};

  type TemplateKey = keyof BroadcastTemplatesResponse['templates'];

  const {
    data: broadcastsData,
    isLoading: broadcastsLoading,
    isError: broadcastsIsError,
    error: broadcastsError,
  } = useQuery<BroadcastsResponse, Error>({
    queryKey: ['broadcasts'],
    queryFn: ({ signal }) => fetchBroadcasts({ signal }),
  });

  const {
    data: templatesData,
    isLoading: templatesLoading,
    isError: templatesIsError,
    error: templatesError,
  } = useQuery<BroadcastTemplatesResponse, Error>({
    queryKey: ['broadcast-templates'],
    queryFn: ({ signal }) => fetchBroadcastTemplates({ signal }),
  });

  const templates = templatesData?.templates;
  const templateKeys = useMemo(
    () => (templates ? (Object.keys(templates) as TemplateKey[]) : []),
    [templates],
  );

  const [text, setText] = useState('');
  const [type, setType] = useState<BroadcastType>('announcement');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey | ''>(
    '',
  );
  const {
    mutate: broadcast,
    isLoading: isSending,
    error: sendError,
  } = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: () => setText(''),
  });

  useApiError(error || sendError || broadcastsError || templatesError);

  const messages = data?.messages ?? [];
  const broadcasts = broadcastsData?.broadcasts ?? [];

  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleString();

  const handleTemplateChange = (value: TemplateKey | '') => {
    setSelectedTemplate(value);
    if (value && templates) {
      setText(templates[value]);
    }
  };

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
        onMarkRead={(id) => markMessageRead(id)}
        renderMessage={(m, onMarkRead) => (
          <div
            className="p-3 bg-primary-bg rounded-xl"
            data-testid={`admin-message-${m.id}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  m.read ? 'bg-dark/40' : 'bg-accent-green'
                }`}
                aria-label={m.read ? 'Message read' : 'Message unread'}
              />
              <span className="text-sm font-semibold">{m.sender}</span>
              <span
                className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  m.read
                    ? 'bg-dark/20 text-text-secondary'
                    : 'bg-accent-yellow/20 text-accent-yellow'
                }`}
              >
                {m.read ? 'Read' : 'Unread'}
              </span>
            </div>
            <p className="text-xs text-text-secondary">{m.preview}</p>
            <button
              className="text-accent-blue text-xs mt-1"
              onClick={() => onMarkRead?.(m.id)}
            >
              Reply
            </button>
          </div>
        )}
      />
      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-text-secondary">
          Recent Broadcasts
        </h3>
        {broadcastsLoading ? (
          <div
            role="status"
            className="rounded-xl bg-card-bg p-3 text-sm text-text-secondary"
          >
            Loading broadcasts...
          </div>
        ) : broadcastsIsError ? (
          <div
            role="alert"
            className="rounded-xl bg-card-bg p-3 text-sm text-danger-red"
          >
            Failed to load broadcasts.
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="rounded-xl bg-card-bg p-3 text-sm text-text-secondary">
            No broadcasts sent yet.
          </div>
        ) : (
          <div className="space-y-2">
            {broadcasts.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-card-bg p-3 text-sm text-text-secondary"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-text-primary">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold capitalize">
                      {item.type}
                    </span>
                    {item.urgent ? (
                      <span className="rounded-full bg-danger-red/10 px-2 py-0.5 text-xs font-semibold text-danger-red">
                        Urgent
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-text-secondary">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-secondary">
          Compose Broadcast
        </h3>
        {templatesLoading ? (
          <div
            role="status"
            className="rounded-xl bg-card-bg p-3 text-sm text-text-secondary"
          >
            Loading broadcast templates...
          </div>
        ) : templatesIsError ? (
          <div
            role="alert"
            className="rounded-xl bg-card-bg p-3 text-sm text-danger-red"
          >
            Failed to load broadcast templates.
          </div>
        ) : templateKeys.length > 0 ? (
          <select
            id="broadcast-template"
            aria-label="Broadcast template"
            value={selectedTemplate}
            onChange={(e) =>
              handleTemplateChange(e.target.value as TemplateKey | '')
            }
            className="w-full rounded-xl border border-dark bg-primary-bg px-3 py-2 text-sm"
          >
            <option value="">Custom message</option>
            {templateKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        ) : (
          <div className="rounded-xl bg-card-bg p-3 text-sm text-text-secondary">
            No templates available.
          </div>
        )}
        <select
          aria-label="Broadcast type"
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
          onChange={(e) => {
            setText(e.target.value);
            setSelectedTemplate('');
          }}
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
