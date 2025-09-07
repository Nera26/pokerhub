'use client';

import Link from 'next/link';
import Button, { type ButtonVariant } from '../ui/Button';
import { useCTAs } from '@/hooks/useLobbyData';

export default function TopCTAs() {
  const { data, isLoading, error } = useCTAs();

  if (isLoading) {
    return (
      <div className="flex gap-4 mb-6">
        <div className="h-12 flex-1 rounded-xl bg-card-bg animate-pulse" />
        <div className="h-12 flex-1 rounded-xl bg-card-bg animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex gap-4 mb-6">
        <div className="h-12 flex-1 rounded-xl bg-card-bg" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 mb-6">
      {data.map((cta) => (
        <Link key={cta.id} href={cta.href}>
          <Button variant={cta.variant as ButtonVariant}>{cta.label}</Button>
        </Link>
      ))}
    </div>
  );
}
