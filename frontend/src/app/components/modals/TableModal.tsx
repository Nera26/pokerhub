'use client';

import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import TableForm, { type TableFormValues } from '../forms/TableForm';
import type { ReactNode } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TableFormValues) => void;
  defaultValues?: TableFormValues;
  title: string;
  submitLabel: ReactNode;
  error?: string | null;
};

export default function TableModal({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  title,
  submitLabel,
  error,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between p-0 border-b border-dark pb-4 mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <button
          aria-label="Close"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary text-xl"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      {error && (
        <p role="alert" className="mb-4 text-danger-red">
          {error}
        </p>
      )}
      <TableForm
        defaultValues={defaultValues}
        submitLabel={submitLabel}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}

