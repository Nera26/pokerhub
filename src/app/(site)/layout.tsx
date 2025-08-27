'use client';

import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Header from '../components/common/Header';
import BottomNav from '../components/common/BottomNav';

export default function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          id="main-content"
          role="main"
          className="min-h-dvh"
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            y: -6,
            transition: { duration: 0.14, ease: [0.65, 0.05, 0.36, 1] },
          }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </>
  );
}
