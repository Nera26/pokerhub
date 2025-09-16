'use client';

import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

type ToastType = 'success' | 'error' | 'loading';

interface ToastNotificationProps {
  /** The message to display in the toast */
  message: string;
  /** Type controls background color: green for success, red for error */
  type?: ToastType;
  /** Controls visibility of the toast */
  isOpen: boolean;
  /** Duration in ms before auto-dismiss (fade-out begins) */
  duration?: number;
  /** Callback invoked after toast fully hides */
  onClose: () => void;
}

export default function ToastNotification({
  message,
  type = 'success',
  isOpen,
  duration = 3000,
  onClose,
}: ToastNotificationProps) {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Trigger show animation and auto-hide
  useEffect(() => {
    let hideTimer: NodeJS.Timeout;
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => setAnimate(true));
      hideTimer = setTimeout(() => setAnimate(false), duration);
    }
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isOpen]);

  // After fade-out, unmount and notify parent
  useEffect(() => {
    let unmountTimer: NodeJS.Timeout;
    if (!animate && mounted) {
      unmountTimer = setTimeout(() => {
        setMounted(false);
        onClose();
      }, 200);
    }
    return () => {
      if (unmountTimer) clearTimeout(unmountTimer);
    };
  }, [animate]);

  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={
          'min-h-12 px-6 py-3 rounded-2xl text-text-primary shadow-lg transition-opacity duration-200 flex items-center ' +
          `${animate ? 'opacity-100' : 'opacity-0'} ` +
          `${
            type === 'success'
              ? 'bg-accent-green'
              : type === 'error'
                ? 'bg-danger-red'
                : 'bg-accent-yellow text-black'
          }`
        }
      >
        {message}
      </div>
    </div>,
    document.body,
  );
}
