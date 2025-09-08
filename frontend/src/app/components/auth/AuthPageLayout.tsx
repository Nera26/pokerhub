'use client';

import type { ReactNode } from 'react';

export interface AuthPageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function AuthPageLayout({ title, children }: AuthPageLayoutProps) {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center gap-6"
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </main>
  );
}
