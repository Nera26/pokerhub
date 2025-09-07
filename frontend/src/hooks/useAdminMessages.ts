import { useQuery } from '@tanstack/react-query';
import { fetchMessages } from '@/lib/api/messages';

export function useAdminMessages() {
  return useQuery({ queryKey: ['adminMessages'], queryFn: fetchMessages });
}

export default useAdminMessages;
