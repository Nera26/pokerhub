'use client';

import { useState } from 'react';
import { useUpdateIban } from '@/hooks/wallet';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import useToasts from '@/hooks/useToasts';
import { Button } from '../ui/Button';
import ToastNotification from '../ui/ToastNotification';
import IBANManagerModal from '../modals/IBANManagerModal';

export default function IbanManager() {
  useRequireAdmin();

  const updateIbanMutation = useUpdateIban();
  const [open, setOpen] = useState(false);
  const [masked, setMasked] = useState(true);
  const { toasts, pushToast } = useToasts();

  const handleUpdate = async (iban: string, holder: string, notes: string) => {
    try {
      await updateIbanMutation.mutateAsync({ iban, holder, notes });
      pushToast('IBAN updated successfully', { variant: 'success' });
      setOpen(false);
    } catch (error) {
      pushToast('Failed to update IBAN', { variant: 'error' });
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Manage IBAN</Button>
      {open && (
        <IBANManagerModal
          open={open}
          onClose={() => setOpen(false)}
          masked={masked}
          onToggleMask={() => setMasked((m) => !m)}
          onUpdate={handleUpdate}
        />
      )}
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.variant === 'error' ? 'error' : 'success'}
          isOpen
          duration={toast.duration}
          onClose={() => {}}
        />
      ))}
    </>
  );
}
