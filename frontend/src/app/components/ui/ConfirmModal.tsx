'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';

import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  icon?: ReactNode;
  iconClassName?: string;
  bodyClassName?: string;
  children?: ReactNode;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClassName = 'bg-danger-red hover:bg-red-600',
  cancelButtonClassName = 'bg-card-bg hover:bg-hover-bg border border-dark',
  icon,
  iconClassName,
  bodyClassName,
  children,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={clsx('p-6 text-center', bodyClassName)}>
        {icon && (
          <div className={clsx('mb-4 flex justify-center', iconClassName)}>
            {icon}
          </div>
        )}
        {title && <h3 className="text-lg font-bold mb-2">{title}</h3>}
        {message && <p className="text-text-secondary mb-6">{message}</p>}
        {children}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onConfirm}
            className={clsx(
              'flex-1 px-4 py-3 rounded-xl font-semibold transition',
              confirmButtonClassName,
            )}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className={clsx(
              'flex-1 px-4 py-3 rounded-xl font-semibold transition',
              cancelButtonClassName,
            )}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
