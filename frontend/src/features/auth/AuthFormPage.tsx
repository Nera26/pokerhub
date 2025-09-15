'use client';

import type { ReactNode } from 'react';
import AuthPageLayout from '@/app/components/auth/AuthPageLayout';

export interface AuthFormPageProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthFormPage({
  title,
  children,
  footer,
}: AuthFormPageProps) {
  return (
    <AuthPageLayout title={title}>
      {children}
      {footer}
    </AuthPageLayout>
  );
}
