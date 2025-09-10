'use client';

import { useRouter } from 'next/navigation';
import CTAForm from '@/app/components/dashboard/CTAForm';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

export default function CTAAdminPage() {
  useRequireAdmin();
  const router = useRouter();

  return <CTAForm onSuccess={() => router.back()} />;
}
