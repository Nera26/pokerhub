'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Card, { CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPaperPlane,
  faSpinner,
  faCheck,
  faWrench,
  faTrophy,
  faInfoCircle,
  faExclamationTriangle,
  faEye,
} from '@fortawesome/free-solid-svg-icons';

type MsgType = 'announcement' | 'alert' | 'notice';

type BroadcastItem = {
  id: string;
  type: MsgType;
  text: string;
  when: string; // e.g. "2 hours ago" or "Just now"
  urgent?: boolean;
  status: 'seen' | 'broadcasting';
  seenCount: number;
};

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

export default function Broadcast({ online = 247 }: { online?: number }) {
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

  // button state and optimistic list handling
  const [isPending, startTransition] = useTransition();
  const [justSent, setJustSent] = useState(false);

  // recent items (pre-seeded to match the HTML)
  const [items, setItems] = useState<BroadcastItem[]>([
    {
      id: 'i1',
      type: 'alert',
      text: 'Server maintenance scheduled for tonight at 2:00 AM EST. Expected downtime: 30 minutes.',
      when: '2 hours ago',
      status: 'seen',
      seenCount: 247,
    },
    {
      id: 'i2',
      type: 'announcement',
      text: 'New tournament series starting this weekend! $50K guaranteed prize pool. Register now!',
      when: '1 day ago',
      status: 'seen',
      seenCount: 189,
    },
    {
      id: 'i3',
      type: 'notice',
      text: 'New rake structure implemented for micro stakes tables. Check the updated rake chart in settings.',
      when: '3 days ago',
      status: 'seen',
      seenCount: 156,
    },
  ]);

  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state: BroadcastItem[], item: BroadcastItem) => [item, ...state],
  );

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

    const optimistic: BroadcastItem = {
      id: crypto.randomUUID(),
      type: values.type,
      text: body,
      urgent: values.urgent,
      when: 'Just now',
      status: 'broadcasting',
      seenCount: online,
    };

    addOptimisticItem(optimistic);

    startTransition(async () => {
      await new Promise((res) => setTimeout(res, 1200));
      if (values.sound) playBeep();
      setItems((prev) => [{ ...optimistic, status: 'seen' }, ...prev]);
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2000);
    });

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
                    disabled={!text.trim() || isPending}
                    leftIcon={
                      isPending ? (
                        <FontAwesomeIcon icon={faSpinner} spin />
                      ) : justSent ? (
                        <FontAwesomeIcon icon={faCheck} />
                      ) : (
                        <FontAwesomeIcon icon={faPaperPlane} />
                      )
                    }
                  >
                    {isPending
                      ? 'SENDING...'
                      : justSent
                        ? 'SENT!'
                        : 'SEND BROADCAST'}
                  </Button>
                  {isPending && (
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
        <div className="space-y-4">
          {optimisticItems.map((it) => {
            const color = TYPE_COLOR[it.type];
            const icon = TYPE_ICON[it.type];
            const urgentLeft = it.urgent ? 'border-l-4 border-danger-red' : '';
            return (
              <div
                key={it.id}
                className={`bg-card-bg p-4 rounded-xl card-shadow ${urgentLeft}`}
              >
                <div className="flex items-start justify-between">
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
                          • {it.when}
                        </span>
                      </div>
                      <p className="text-text-primary">{it.text}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    {it.status === 'broadcasting' ? (
                      <>
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <span>Broadcasting...</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faEye} />
                        <span>{it.seenCount} delivered</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
