'use client';

import TableForm, { type TableFormValues } from '../forms/TableForm';
import FormModal from './FormModal';
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
    <FormModal isOpen={isOpen} onClose={onClose} title={title} error={error}>
      <TableForm
        defaultValues={defaultValues}
        submitLabel={submitLabel}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </FormModal>
  );
}
