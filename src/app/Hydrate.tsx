'use client';

import { HydrationBoundary } from '@tanstack/react-query';
import type { DehydratedState } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export default function Hydrate({
  state,
  children,
}: {
  state: DehydratedState;
  children: ReactNode;
}) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
