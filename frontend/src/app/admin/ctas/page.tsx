'use client';

import { useRouter } from 'next/navigation';
import CTAForm from '@/components/dashboard/cta-form';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

export default function CTAAdminPage() {
  useRequireAdmin();
  const router = useRouter();

  return <CTAForm onSuccess={() => router.back()} />;
}
