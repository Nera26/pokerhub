import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import type { Notification } from '@/lib/api/notifications';
import useOnClickOutside from '@/hooks/useOnClickOutside';

interface NotificationDropdownProps {
  notifications: Notification[];
}

export default function NotificationDropdown({
  notifications,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const count = notifications.length;

  function close(focus = true) {
    setOpen(false);
    if (focus) {
      buttonRef.current?.focus();
    }
  }

  useOnClickOutside(ref, () => close(false));

  useEffect(() => {
    if (open) {
      const items =
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items?.forEach((item, i) => {
        item.tabIndex = i === 0 ? 0 : -1;
      });
      items?.[0]?.focus();
    }
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      close();
    }
    if (e.key === 'Tab') {
      requestAnimationFrame(() => {
        if (ref.current && !ref.current.contains(document.activeElement)) {
          close();
        }
      });
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items =
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (!items?.length) {
        return;
      }

      const current = document.activeElement as HTMLElement;
      const index = Array.from(items).indexOf(current);
      if (index === -1) {
        return;
      }

      const nextIndex =
        e.key === 'ArrowDown'
          ? (index + 1) % items.length
          : (index - 1 + items.length) % items.length;

      items.forEach((item, i) => {
        item.tabIndex = i === nextIndex ? 0 : -1;
      });

      items[nextIndex].focus();
      e.preventDefault();
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        className="relative text-text-secondary hover:text-accent-yellow transition-colors duration-200 flex items-center"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
        title="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <FontAwesomeIcon icon={faBell} className="text-xl" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-red text-[10px] leading-none text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          ref={menuRef}
          onKeyDown={handleKeyDown}
          className="absolute right-0 mt-3 w-80 rounded-2xl border border-dark bg-card-bg shadow-xl p-3"
        >
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              className="text-xs text-text-secondary hover:text-accent-yellow"
              onClick={() => close()}
            >
              Close
            </button>
          </div>

          <ul className="max-h-80 overflow-auto divide-y divide-dark/70">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="py-2 first:pt-0 last:pb-0"
                role="menuitem"
                tabIndex={-1}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 w-2 h-2 rounded-full bg-accent-yellow inline-block" />
                  <div className="flex-1">
                    <p className="text-sm">{n.title}</p>
                    <p className="text-xs text-text-secondary">
                      {n.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="py-6 text-center text-sm text-text-secondary">
                No notifications
              </li>
            )}
          </ul>

          <div className="pt-3">
            <Link
              href="/notification"
              prefetch
              onClick={() => close()}
              className="block text-center w-full bg-accent-yellow text-black font-semibold py-2 rounded-xl hover:brightness-110"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
