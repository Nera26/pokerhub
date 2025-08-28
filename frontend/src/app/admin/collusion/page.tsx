'use client';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthToken } from '@/app/store/authStore';

const CollusionPage = dynamic(() => import('@/features/collusion'), {
  loading: () => <div>Loading...</div>,
});

function useRequireAdmin() {
  const router = useRouter();
  const token = useAuthToken();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'admin') {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    }
  }, [token, router]);
}

export default function CollusionReviewPage() {
  useRequireAdmin();
  return <CollusionPage />;
}

