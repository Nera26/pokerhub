'use client';

import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const router = useRouter();
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-6"
    >
      <h1 className="text-2xl font-bold">Forgot Password</h1>
      <ForgotPasswordForm onBack={() => router.push('/login')} />
    </main>
  );
}
