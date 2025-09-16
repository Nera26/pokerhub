'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import AuthFormPage from '@/features/auth/AuthFormPage';
import SocialLoginButtons from '@/app/components/auth/SocialLoginButtons';

export interface AuthSimplePageProps {
  title: string;
  form: ReactNode;
  linkHref: string;
  linkText: string;
}

export default function AuthSimplePage({
  title,
  form,
  linkHref,
  linkText,
}: AuthSimplePageProps) {
  return (
    <AuthFormPage
      title={title}
      footer={
        <>
          <SocialLoginButtons />
          <Link href={linkHref} className="text-accent-yellow hover:underline">
            {linkText}
          </Link>
        </>
      }
    >
      {form}
    </AuthFormPage>
  );
}
