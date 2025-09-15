'use client';

import AuthFormPage from '@/features/auth/AuthFormPage';
import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm';
import SocialLoginButtons from '@/app/components/auth/SocialLoginButtons';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <AuthFormPage
      title="Forgot Password"
      footer={
        <>
          <SocialLoginButtons />
          <Link href="/login" className="text-accent-yellow hover:underline">
            Back to Login
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthFormPage>
  );
}
