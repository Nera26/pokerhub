'use client';

import LoginForm from '@/app/components/auth/LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-6"
    >
      <h1 className="text-2xl font-bold">Login</h1>
      <LoginForm />
    </main>
  );
}
