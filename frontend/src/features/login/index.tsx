'use client';

import AuthFormPage from '@/features/auth/AuthFormPage';
import LoginForm from '@/app/components/auth/LoginForm';
import SocialLoginButtons from '@/app/components/auth/SocialLoginButtons';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <AuthFormPage
      title="Login"
      footer={
        <>
          <SocialLoginButtons />
          <Link
            href="/forgot-password"
            className="text-accent-yellow hover:underline"
          >
            Forgot password?
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthFormPage>
  );
}
