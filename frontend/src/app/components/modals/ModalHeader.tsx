'use client';

import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface Props {
  title: ReactNode;
  onClose: () => void;
}

export default function ModalHeader({ title, onClose }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-dark px-6 py-4">
      <h3 className="text-xl font-bold">{title}</h3>
      <button
        onClick={onClose}
        aria-label="Close"
        className="w-9 h-9 grid place-items-center rounded-xl text-text-secondary hover:bg-hover-bg"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}
