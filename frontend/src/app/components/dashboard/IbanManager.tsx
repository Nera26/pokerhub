'use client';

import { useState } from 'react';
import { useIban, useIbanHistory } from '@/hooks/wallet';
import IBANManagerModal from '../modals/IBANManagerModal';
import { updateIban } from '@/lib/api/wallet';

export default function IbanManager() {
  const ibanQuery = useIban();
  const historyQuery = useIbanHistory();
  const [open, setOpen] = useState(false);
  const [masked, setMasked] = useState(true);

  const handleUpdate = async (
    iban: string,
    holder: string,
    notes: string,
  ) => {
    await updateIban(iban, holder, notes);
    await Promise.all([ibanQuery.refetch(), historyQuery.refetch()]);
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>Manage IBAN</button>
      {ibanQuery.data && historyQuery.data && (
        <IBANManagerModal
          open={open}
          onClose={() => setOpen(false)}
          currentIbanMasked={ibanQuery.data.masked}
          currentIbanFull={ibanQuery.data.iban}
          masked={masked}
          holder={ibanQuery.data.holder}
          instructions={ibanQuery.data.instructions}
          onToggleMask={() => setMasked((m) => !m)}
          onUpdate={handleUpdate}
          history={historyQuery.data.history}
          onReuse={(iban) => handleUpdate(iban, ibanQuery.data!.holder, '')}
          lastUpdatedBy={ibanQuery.data.updatedBy}
          lastUpdatedAt={ibanQuery.data.updatedAt}
        />
      )}
    </>
  );
}

