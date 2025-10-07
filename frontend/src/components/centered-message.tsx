'use client';

import type { PropsWithChildren } from 'react';

export default function CenteredMessage({ children }: PropsWithChildren) {
  return <p className="text-center mt-8">{children}</p>;
}

