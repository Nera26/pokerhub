import { useState } from 'react';

type ToastState = {
  msg: string;
  type: 'success' | 'error';
  open: boolean;
};

export default function useToast() {
  const [toast, setToast] = useState<ToastState>({
    msg: '',
    type: 'success',
    open: false,
  });

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    if (!msg) {
      setToast((t) => ({ ...t, open: false }));
    } else {
      setToast({ msg, type, open: true });
    }
  };

  return { toast, notify };
}
