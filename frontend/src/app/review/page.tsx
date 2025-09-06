"use client";

import dynamic from 'next/dynamic';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

const ReviewPage = dynamic(() => import('@/features/collusion'), {
  loading: () => <div>Loading...</div>,
});

export default function Page() {
  useRequireAdmin();
  return <ReviewPage />;
}
