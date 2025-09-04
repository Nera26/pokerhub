'use client';

import NextTopLoader from 'nextjs-toploader';

export default function TopProgressBar() {
  return (
    <NextTopLoader
      color="var(--color-accent-yellow)"
      height={1}
      showSpinner={false}
    />
  );
}
