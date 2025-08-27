'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SmoothButton from './SmoothButton';
import { ButtonProps } from './Button';

type LinkButtonProps = ButtonProps & {
  href: string;
  children: React.ReactNode;
};

export default function LinkButton({
  href,
  children,
  ...props
}: LinkButtonProps) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  const handleClick = () => {
    router.push(href);
  };

  return (
    <SmoothButton onClick={handleClick} {...props}>
      {children}
    </SmoothButton>
  );
}
