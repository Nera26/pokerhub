'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuditAlerts } from '@/hooks/useAuditAlerts';
import ToastNotification from '../../ui/ToastNotification';
import useToasts from '@/hooks/useToasts';

export default function SecurityAlerts() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useAuditAlerts();
  const alerts = data ?? [];
  const unread = alerts.filter((a) => !a.resolved).length;

  const { toasts, pushToast } = useToasts();
  const seen = useRef(new Set<string>());

  useEffect(() => {
    alerts
      .filter((a) => !a.resolved && !seen.current.has(a.id))
      .forEach((a) => {
        seen.current.add(a.id);
        pushToast(a.title, {
          variant: a.severity === 'danger' ? 'error' : 'info',
        });
      });
  }, [alerts, pushToast]);

  const acknowledge = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/security-alerts/${id}/ack`, { method: 'POST' }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-security-alerts'] }),
  });

  if (isLoading)
    return (
      <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        Loading alerts...
      </div>
    );
  if (isError)
    return (
      <div
        className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
        role="alert"
      >
        Failed to load alerts
      </div>
    );

  if (alerts.length === 0)
    return (
      <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        <h3 className="text-lg font-bold mb-2">Security Alerts</h3>
        <p>No security alerts</p>
      </div>
    );

  return (
    <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)] relative">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        Security Alerts
        {unread > 0 && (
          <span className="ml-2 bg-danger-red text-white text-xs px-2 py-0.5 rounded-full">
            {unread}
          </span>
        )}
      </h3>
      <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="border border-dark rounded-xl p-3 flex justify-between items-start"
          >
            <div>
              <p
                className={`font-semibold mb-1 ${
                  a.severity === 'danger'
                    ? 'text-danger-red'
                    : 'text-accent-yellow'
                }`}
              >
                {a.title}
              </p>
              <p className="text-sm text-text-secondary mb-1">{a.body}</p>
              <span className="text-xs text-text-secondary">{a.time}</span>
            </div>
            {!a.resolved && (
              <button
                className="text-sm text-accent-blue hover:underline"
                onClick={() => acknowledge.mutate(a.id)}
              >
                Acknowledge
              </button>
            )}
          </li>
        ))}
      </ul>
      {toasts.map((t) => (
        <ToastNotification
          key={t.id}
          message={t.message}
          type={t.variant === 'error' ? 'error' : 'success'}
          isOpen
          duration={t.duration}
          onClose={() => {}}
        />
      ))}
    </div>
  );
}
