// src/app/components/user/LogoutModal.tsx
'use client';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import useLogout from '@/hooks/useLogout';

interface Props {
  isOpen: boolean;
  onClose(): void;
}

export default function LogoutModal({ isOpen, onClose }: Props) {
  const logoutMutation = useLogout();

  const handleConfirm = () => {
    logoutMutation.mutate(undefined, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col space-y-4">
        <h3 className="text-xl font-bold">Confirm Logout</h3>
        <p className="text-text-secondary">Are you sure you want to log out?</p>
        <div className="flex justify-end space-x-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="cursor-pointer hover:brightness-110"
            onClick={handleConfirm}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Logging out…' : 'Logout'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
