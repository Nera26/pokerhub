import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

interface RouteLoadingProps {
  className?: string;
}

export default function RouteLoading({
  children,
  className,
}: PropsWithChildren<RouteLoadingProps>) {
  return (
    <>
      <div className="h-20 bg-card-bg animate-pulse" />
      <main
        aria-busy="true"
        className={clsx(
          'container mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-[calc(env(safe-area-inset-bottom)+72px)]',
          className,
        )}
      >
        {children}
      </main>
      <div className="h-20 bg-card-bg animate-pulse" />
    </>
  );
}
