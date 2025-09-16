'use client';

import LoginForm from '@/app/components/auth/LoginForm';
import AuthSimplePage from '@/features/auth/AuthSimplePage';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <AuthSimplePage
      title="Login"
      form={<LoginForm />}
      linkHref="/forgot-password"
      linkText="Forgot password?"
    />
  );
}
