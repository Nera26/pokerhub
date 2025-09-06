import type { QueryClient } from '@tanstack/react-query';
import type { Message } from '@/app/components/common/chat/types';

export function scheduleTimeout(
  queryClient: QueryClient,
  timers: Map<number, ReturnType<typeof setTimeout>>,
  id: number,
): void {
  const existing = timers.get(id);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    queryClient.setQueryData<Message[]>(['chat', 'messages'], (prev = []) =>
      prev.map((m) =>
        m.id === id ? { ...m, pending: false, error: true } : m,
      ),
    );
    timers.delete(id);
  }, 5000);
  timers.set(id, timer);
}
