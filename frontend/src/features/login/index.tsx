'use client';

import AuthPageLayout from '@/app/components/auth/AuthPageLayout';
import LoginForm from '@/app/components/auth/LoginForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <AuthPageLayout title="Login">
      <LoginForm />
      <Link
        href="/forgot-password"
        className="text-accent-yellow hover:underline"
      >
        Forgot password?
      </Link>
    </AuthPageLayout>
  );
}
