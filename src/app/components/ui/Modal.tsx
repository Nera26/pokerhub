'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import useRenderCount from '@/hooks/useRenderCount';
import { createPortal } from 'react-dom';

export interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the modal requests to close (overlay click or programmatic) */
  onClose: () => void;
  /** Inner content of the modal */
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  useRenderCount('Modal');
  const [mounted, setMounted] = useState(isOpen);
  const [animateIn, setAnimateIn] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    const mainContent = document.getElementById('main-content');

    if (isOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      setMounted(true);
      // next frame: trigger fade-in
      requestAnimationFrame(() => setAnimateIn(true));
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
      mainContent?.setAttribute('aria-hidden', 'true');
    } else if (mounted) {
      // fade-out then unmount
      setAnimateIn(false);
      const timer = setTimeout(() => {
        setMounted(false);
        lastFocusedRef.current?.focus();
      }, 200);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      mainContent?.removeAttribute('aria-hidden');
      return () => clearTimeout(timer);
    }

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      mainContent?.removeAttribute('aria-hidden');
    };
  }, [isOpen, mounted, onClose]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen, mounted]);

  function trapFocus(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const elements = Array.from(focusable);
    if (elements.length === 0) {
      e.preventDefault();
      dialog.focus();
      return;
    }
    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || active === dialog) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || active === dialog) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-200 ease-out
        ${animateIn ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`bg-card-bg rounded-2xl p-6 w-full max-w-2xl transform transition-transform duration-200 ease-out
          ${animateIn ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapFocus}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
