'use client';

import Modal from '../ui/Modal';
import ModalHeader from './ModalHeader';
import type { ReactNode } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  error?: string | null;
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  error,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      {error && (
        <p role="alert" className="px-6 pt-6 mb-4 text-danger-red">
          {error}
        </p>
      )}
      {children}
    </Modal>
  );
}
