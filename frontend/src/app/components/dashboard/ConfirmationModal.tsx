'use client';

import ConfirmModal from '../ui/ConfirmModal';

type ConfirmationModalProps = {
  action: 'ban' | 'unban';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
};

export default function ConfirmationModal({
  action,
  isOpen,
  onClose,
  onConfirm,
  userName,
}: ConfirmationModalProps) {
  const isUnban = action === 'unban';
  const confirmColor = isUnban
    ? 'bg-accent-green hover:bg-green-600'
    : 'bg-danger-red hover:bg-red-600';
  const confirmText = isUnban ? 'Unban' : 'Ban';

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Action"
      message={`Are you sure you want to ${action} ${userName}?`}
      confirmText={confirmText}
      confirmButtonClassName={confirmColor}
    />
  );
}

