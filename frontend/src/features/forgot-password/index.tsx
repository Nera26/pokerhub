'use client';

import AuthPageLayout from '@/app/components/auth/AuthPageLayout';
import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const router = useRouter();
  return (
    <AuthPageLayout title="Forgot Password">
      <ForgotPasswordForm onBack={() => router.push('/login')} />
    </AuthPageLayout>
  );
}
