'use client';

import LoginForm from '@/app/components/auth/LoginForm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-6"
    >
      <h1 className="text-2xl font-bold">Login</h1>
      <LoginForm />
      <Link
        href="/forgot-password"
        className="text-accent-yellow hover:underline"
      >
        Forgot password?
      </Link>
    </main>
  );
}
