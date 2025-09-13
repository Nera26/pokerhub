'use client';

import { useState } from 'react';
import { useUpdateIban } from '@/hooks/wallet';
import IBANManagerModal from '../modals/IBANManagerModal';

export default function IbanManager() {
  const updateIbanMutation = useUpdateIban();
  const [open, setOpen] = useState(false);
  const [masked, setMasked] = useState(true);

  const handleUpdate = async (iban: string, holder: string, notes: string) => {
    await updateIbanMutation.mutateAsync({ iban, holder, notes });
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>Manage IBAN</button>
      {open && (
        <IBANManagerModal
          open={open}
          onClose={() => setOpen(false)}
          masked={masked}
          onToggleMask={() => setMasked((m) => !m)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}
