'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthToken } from '@/app/store/authStore';

export function useRequireAdmin(): void {
  const router = useRouter();
  const token = useAuthToken();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      if (payload.role !== 'admin') {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  }, [token, router]);
}
