'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminEvents } from '@/hooks/admin';
import { acknowledgeAdminEvent } from '@/lib/api/admin';
import Button from '../ui/Button';

export default function AdminEvents() {
  const { data, isLoading, error } = useAdminEvents();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: acknowledgeAdminEvent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-events'] }),
  });

  if (isLoading) return <div>Loading events...</div>;
  if (error) return <div role="alert">Failed to load events.</div>;

  const events = data ?? [];

  if (events.length === 0) {
    return <div>No events</div>;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{e.title}</p>
              <p className="text-sm text-text-secondary">{e.description}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => mutation.mutate(e.id)}
            >
              Acknowledge
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
