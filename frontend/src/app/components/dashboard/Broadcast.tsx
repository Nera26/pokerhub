'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import ToastNotification from '../ui/ToastNotification';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faSpinner,
  faWrench,
  faTrophy,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { fetchBroadcasts, sendBroadcast } from '@/lib/api/broadcasts';
import {
  type BroadcastsResponse,
  type SendBroadcastRequest,
} from '@shared/types';
import useToast from './useToast';

type MsgType = 'announcement' | 'alert' | 'notice';

const TYPE_ICON: Record<MsgType, string> = {
  announcement: '📢',
  alert: '⚠️',
  notice: 'ℹ️',
};

const TYPE_COLOR: Record<MsgType, string> = {
  announcement: 'text-accent-yellow',
  alert: 'text-danger-red',
  notice: 'text-accent-blue',
};

const MAX_LEN = 500;

const broadcastSchema = z.object({
  type: z.enum(['announcement', 'alert', 'notice']),
  text: z.string().trim().min(1, 'Message is required').max(MAX_LEN),
  urgent: z.boolean(),
  sound: z.boolean(),
});

type BroadcastForm = z.infer<typeof broadcastSchema>;

export default function Broadcast() {
  const { register, handleSubmit, watch, reset, setValue, formState } =
    useForm<BroadcastForm>({
      resolver: zodResolver(broadcastSchema),
      defaultValues: {
        type: 'announcement',
        text: '',
        urgent: false,
        sound: true,
      },
    });

  const type = watch('type');
  const text = watch('text');
  const count = text.length;

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: ({ signal }) => fetchBroadcasts({ signal }),
  });
  const broadcasts = data?.broadcasts ?? [];

  const { toast, notify } = useToast();

  const mutation = useMutation({
    mutationFn: (values: SendBroadcastRequest) => sendBroadcast(values),
    onMutate: async (values: SendBroadcastRequest) => {
      await queryClient.cancelQueries({ queryKey: ['broadcasts'] });
      const previous = queryClient.getQueryData<BroadcastsResponse>([
        'broadcasts',
      ]);
      const optimistic = {
        id: crypto.randomUUID(),
        type: values.type,
        text: values.text,
        urgent: values.urgent,
        timestamp: new Date().toISOString(),
      };
      queryClient.setQueryData<BroadcastsResponse>(['broadcasts'], {
        broadcasts: previous
          ? [optimistic, ...(previous.broadcasts ?? [])]
          : [optimistic],
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['broadcasts'], ctx.previous);
      }
      notify('Failed to send broadcast', 'error');
    },
    onSuccess: (_data, vars) => {
      if (vars.sound) playBeep();
      notify('Broadcast sent');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
  });

  const previewIcon = TYPE_ICON[type];
  const previewColor = TYPE_COLOR[type];

  function insertTemplate(kind: 'maintenance' | 'tournament') {
    const msg =
      kind === 'maintenance'
        ? 'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.'
        : 'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!';
    setValue('text', msg.slice(0, MAX_LEN), { shouldValidate: true });
  }

  function playBeep() {
    try {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      /* ignore if blocked */
    }
  }

  function onSubmit(values: BroadcastForm) {
    const body = values.text.trim();
    if (!body) return;
    mutation.mutate(values);
    reset({ ...values, text: '', urgent: false });
  }

  return (
    <div className="space-y-8">
      {/* header */}
      <section className="mb-2">
        <h2 className="text-2xl font-bold">Broadcast Tool</h2>
        <p className="text-text-secondary">
          Send global announcements to all players
        </p>
      </section>

      {/* form */}
      <section className="max-w-4xl">
        <Card className="border border-dark">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* type */}
              <div className="mb-6">
                <label className="block font-semibold mb-3">Message Type</label>
                <select
                  {...register('type')}
                  className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                >
                  <option value="announcement">📢 Announcement</option>
                  <option value="alert">⚠️ Alert</option>
                  <option value="notice">ℹ️ Notice</option>
                </select>
              </div>

              {/* content */}
              <div className="mb-8">
                <label className="block font-semibold mb-3">
                  Message Content
                </label>
                <textarea
                  maxLength={MAX_LEN}
                  {...register('text')}
                  placeholder="Enter your broadcast message here..."
                  className="w-full h-40 bg-primary-bg border border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none resize-none"
                />
                {formState.errors.text && (
                  <span className="text-danger-red text-sm">
                    {formState.errors.text.message}
                  </span>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-text-secondary text-sm">
                    Character count{' '}
                    <span className="text-accent-yellow">{count}</span>/
                    {MAX_LEN}
                  </span>

                  <div className="flex gap-3">
                    <button
                      className="text-accent-blue text-sm hover:brightness-110 inline-flex items-center gap-2"
                      type="button"
                      onClick={() => insertTemplate('maintenance')}
                    >
                      <FontAwesomeIcon icon={faWrench} />
                      Maintenance Template
                    </button>
                    <button
                      className="text-accent-blue text-sm hover:brightness-110 inline-flex items-center gap-2"
                      type="button"
                      onClick={() => insertTemplate('tournament')}
                    >
                      <FontAwesomeIcon icon={faTrophy} />
                      Tournament Template
                    </button>
                  </div>
                </div>
              </div>

              {/* preview */}
              <div className="mb-8">
                <h3 className="font-semibold mb-3">Preview</h3>
                <div className="bg-primary-bg border border-dark rounded-xl p-4 min-h-[80px]">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{previewIcon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`${previewColor} font-semibold text-sm uppercase`}
                        >
                          {type.toUpperCase()}
                        </span>
                        <span className="text-text-secondary text-xs">
                          • Admin
                        </span>
                      </div>
                      <p className="text-text-secondary">
                        {text.trim()
                          ? text
                          : 'Your message will appear here...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* options + send */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('urgent')}
                      className="w-4 h-4 accent-danger-red"
                    />
                    <span className="text-text-secondary">Mark as urgent</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('sound')}
                      className="w-4 h-4 accent-accent-yellow"
                    />
                    <span className="text-text-secondary">
                      Play notification sound
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    disabled={!text.trim() || mutation.isPending}
                    leftIcon={
                      mutation.isPending ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : (
                        <FontAwesomeIcon icon={faPaperPlane} />
                      )
                    }
                  >
                    {mutation.isPending ? 'SENDING...' : 'SEND BROADCAST'}
                  </Button>
                  {mutation.isPending && (
                    <span className="text-text-secondary text-sm">
                      Saving...
                    </span>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* recent broadcasts */}
      <section className="mt-2">
        <h3 className="text-xl font-bold mb-4">Recent Broadcasts</h3>
        {isLoading ? (
          <div>Loading broadcasts...</div>
        ) : broadcasts.length === 0 ? (
          <div className="text-text-secondary">No broadcasts yet.</div>
        ) : (
          <div className="space-y-4">
            {broadcasts.map((it) => {
              const color = TYPE_COLOR[it.type];
              const icon = TYPE_ICON[it.type];
              const urgentLeft = it.urgent ? 'border-l-4 border-danger-red' : '';
              const when = new Date(it.timestamp).toLocaleString();
              return (
                <div
                  key={it.id}
                  className={`bg-card-bg p-4 rounded-xl card-shadow ${urgentLeft}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl">{icon}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {it.urgent && (
                          <FontAwesomeIcon
                            icon={faExclamationTriangle}
                            className="text-danger-red text-sm"
                          />
                        )}
                        <span
                          className={`${color} font-semibold text-sm uppercase`}
                        >
                          {it.type.toUpperCase()}
                        </span>
                        <span className="text-text-secondary text-xs">
                          • {when}
                        </span>
                      </div>
                      <p className="text-text-primary">{it.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <ToastNotification
        message={toast.msg}
        type={toast.type}
        isOpen={toast.open}
        onClose={() => notify('')}
      />
    </div>
  );
}
