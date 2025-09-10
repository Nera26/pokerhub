'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faEye,
  faReply,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';

import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { markMessageRead } from '@/lib/api/messages';
import {
  useAdminMessages,
  useReplyMessage,
} from '@/hooks/useAdminMessageActions';
import AdminMessageList from './AdminMessageList';
import type { AdminMessage, AdminMessagesResponse } from '@shared/types';
import type { ApiError } from '@/lib/api/client';

const formSchema = z.object({
  search: z.string().optional(),
  replyText: z
    .string()
    .trim()
    .min(1, 'Reply is required')
    .max(1000, 'Reply must be at most 1000 characters'),
});

type FormValues = z.infer<typeof formSchema>;

export default function Messages() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useAdminMessages();
  const mutation = useReplyMessage();

  const messages = data?.messages ?? [];
  const [viewing, setViewing] = useState<AdminMessage | null>(null);
  const [replyTo, setReplyTo] = useState<AdminMessage | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { search: '', replyText: '' },
  });

  const search = watch('search') ?? '';
  const replyText = watch('replyText');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => {
      const hay =
        `${m.sender} ${m.userId} ${m.subject} ${m.preview} ${m.content}`.toLowerCase();
      return hay.includes(q);
    });
  }, [messages, search]);

  const unread = messages.filter((m) => !m.read).length;

  const markRead = useMutation({
    mutationFn: (id: number) => markMessageRead(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['admin-messages'] });
      const prev = queryClient.getQueryData<AdminMessagesResponse>([
        'admin-messages',
      ]);
      if (prev) {
        queryClient.setQueryData(['admin-messages'], {
          messages: prev.messages.map((m) =>
            m.id === id ? { ...m, read: true } : m,
          ),
        } as AdminMessagesResponse);
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['admin-messages'], ctx.prev);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] }),
  });

  const openView = (m: AdminMessage) => {
    markRead.mutate(m.id);
    setViewing({ ...m, read: true });
  };

  const openReply = (m: AdminMessage) => {
    markRead.mutate(m.id);
    setReplyTo(m);
    setValue('replyText', '');
  };

  const sendReply = () =>
    handleSubmit(({ replyText }) => {
      if (!replyTo || !replyText.trim()) return;
      mutation.mutate({ id: replyTo.id, reply: replyText });
      setReplyTo(null);
      setValue('replyText', '');
    })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-text-secondary">View and respond to user DMs</p>
        </div>
        <div className="flex items-center gap-2 bg-card-bg px-3 py-2 rounded-xl">
          <span className="w-2 h-2 bg-accent-yellow rounded-full animate-pulse" />
          <span className="text-sm font-semibold">{unread} Unread</span>
        </div>
      </section>

      {/* Search */}
      <section>
        <div className="relative">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            {...register('search')}
            placeholder="Search messages..."
            className="w-full bg-card-bg border border-dark rounded-xl pl-12 pr-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
          />
        </div>
      </section>

      {/* Table */}
      <section className="bg-card-bg rounded-2xl card-shadow overflow-hidden">
        {/* Header row — removed border */}
        <div className="bg-primary-bg px-6 py-4">
          <div className="grid grid-cols-12 gap-4 text-text-secondary text-sm font-semibold">
            <div className="col-span-3">Sender</div>
            <div className="col-span-5">Message Preview</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>

        <AdminMessageList
          messages={filtered}
          isLoading={isLoading}
          isError={isError}
          error={error as ApiError}
          renderMessage={(m) => (
            <div
              className={`px-6 py-4 transition-colors transition-opacity duration-200 cursor-pointer hover:bg-hover-bg ${m.read ? 'opacity-60' : ''}`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Sender */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="relative">
                    <Image
                      src={m.avatar}
                      alt={m.sender}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                    {!m.read && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-yellow rounded-full grid place-items-center">
                        <div className="w-2 h-2 bg-black rounded-full" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{m.sender}</p>
                    <p className="text-text-secondary text-xs">
                      ID: {m.userId}
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="col-span-5">
                  <p className="text-text-primary font-medium">{m.subject}</p>
                  <p className="text-text-secondary text-sm">{m.preview}</p>
                </div>

                {/* Date */}
                <div className="col-span-2">
                  <p className="text-text-secondary text-sm">{m.time}</p>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex gap-2">
                  <Button
                    variant="chipBlue"
                    onClick={() => openView(m)}
                    leftIcon={<FontAwesomeIcon icon={faEye} />}
                    aria-label="View"
                  >
                    View
                  </Button>
                  <Button
                    variant="chipYellow"
                    onClick={() => openReply(m)}
                    leftIcon={<FontAwesomeIcon icon={faReply} />}
                    aria-label="Reply"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        />
      </section>

      {/* View modal */}
      <Modal isOpen={!!viewing} onClose={() => setViewing(null)}>
        {viewing && (
          <>
            <div className="bg-primary-bg px-6 py-4 border-b border-dark flex items-center justify-between -mx-6 -mt-6 rounded-t-2xl">
              <h3 className="text-xl font-bold">Message Details</h3>
              <button
                className="text-text-secondary hover:text-text-primary"
                onClick={() => setViewing(null)}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Image
                  src={viewing.avatar}
                  alt={viewing.sender}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-bold text-lg">{viewing.sender}</p>
                  <p className="text-text-secondary text-sm">
                    ID: {viewing.userId}
                  </p>
                </div>
              </div>

              <div className="bg-primary-bg rounded-xl p-4 mb-4">
                <h4 className="font-semibold mb-2">{viewing.subject}</h4>
                <p className="text-text-secondary leading-relaxed">
                  {viewing.content}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-text-secondary">
                <span>{viewing.time}</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-blue" />
                  Viewed by Admin
                </span>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Reply modal */}
      <Modal isOpen={!!replyTo} onClose={() => setReplyTo(null)}>
        {replyTo && (
          <>
            <div className="bg-primary-bg px-6 py-4 border-b border-dark flex items-center justify-between -mx-6 -mt-6 rounded-t-2xl">
              <h3 className="text-xl font-bold">
                Reply to{' '}
                <span className="text-accent-yellow">{replyTo.sender}</span>
              </h3>
              <button
                className="text-text-secondary hover:text-text-primary"
                onClick={() => setReplyTo(null)}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold mb-2">
                Your Reply
              </label>
              <textarea
                {...register('replyText')}
                placeholder="Type your reply here..."
                maxLength={1000}
                className="w-full bg-primary-bg border border-dark rounded-xl p-4 text-text-primary focus:border-accent-yellow focus:outline-none min-h-[120px] resize-none"
              />
              <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
                <span>Max 1000 characters</span>
                <span>{replyText.length}/1000</span>
              </div>
              {errors.replyText && (
                <p className="text-danger-red text-xs mt-1">
                  {errors.replyText.message}
                </p>
              )}

              <div className="flex gap-3 justify-end mt-4">
                <Button
                  variant="ghost"
                  className="bg-card-bg border border-dark"
                  onClick={() => setReplyTo(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendReply}
                  leftIcon={<FontAwesomeIcon icon={faPaperPlane} />}
                >
                  Send Reply
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
