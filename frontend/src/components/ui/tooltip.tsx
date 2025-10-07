'use client';

import {
  ReactNode,
  useState,
  useId,
  HTMLAttributes,
  useRef,
  useEffect,
} from 'react';

interface TooltipProps {
  /** The text to display inside the tooltip */
  text: string;
  /** The element that triggers the tooltip */
  children: ReactNode;
  /** Delay (ms) before showing the tooltip on hover */
  delay?: number;
  /** Optional props forwarded to the wrapper element */
  wrapperProps?: HTMLAttributes<HTMLSpanElement>;
}

export default function Tooltip({
  text,
  children,
  delay = 0,
  wrapperProps,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (delay) {
      timerRef.current = setTimeout(() => setVisible(true), delay);
    } else {
      setVisible(true);
    }
  };

  const hide = () => {
    clearTimeout(timerRef.current!);
    timerRef.current = null;
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <span
      className="relative inline-block cursor-pointer"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={tooltipId}
      tabIndex={wrapperProps?.tabIndex ?? 0}
      {...wrapperProps}
    >
      {children}
      <span
        role="tooltip"
        id={tooltipId}
        className={
          'absolute bottom-full left-1/2 mb-2 w-max max-w-xs whitespace-nowrap rounded bg-card-bg px-2 py-1 text-xs text-text-primary z-50 transition-opacity duration-200 ' +
          `${visible ? 'opacity-100 visible' : 'opacity-0 invisible'}`
        }
      >
        {text}
      </span>
    </span>
  );
}
