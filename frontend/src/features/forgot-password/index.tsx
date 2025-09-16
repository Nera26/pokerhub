'use client';

import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm';
import AuthSimplePage from '@/features/auth/AuthSimplePage';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return (
    <AuthSimplePage
      title="Forgot Password"
      form={<ForgotPasswordForm />}
      linkHref="/login"
      linkText="Back to Login"
    />
  );
}
