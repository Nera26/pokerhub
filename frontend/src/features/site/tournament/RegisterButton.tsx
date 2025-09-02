'use client';

import { useState } from 'react';
import Button from '@/app/components/ui/Button';
import { registerTournament, withdrawTournament } from '@/lib/api/lobby';

interface RegisterButtonProps {
  id: string;
  initialRegistered: boolean;
}

export default function RegisterButton({
  id,
  initialRegistered,
}: RegisterButtonProps) {
  const [registered, setRegistered] = useState(initialRegistered);

  const handleClick = async () => {
    if (registered) {
      await withdrawTournament(id);
      setRegistered(false);
    } else {
      await registerTournament(id);
      setRegistered(true);
    }
  };

  return (
    <Button
      variant={registered ? 'outline' : 'primary'}
      size="sm"
      onClick={handleClick}
    >
      {registered ? 'Withdraw' : 'Register'}
    </Button>
  );
}
