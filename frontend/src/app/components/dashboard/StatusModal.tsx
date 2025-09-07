'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import Modal from '../ui/Modal';
import { CardTitle } from '../ui/Card';

interface StatusModalProps {
  action: 'pause' | 'resume';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bonusName: string;
}

export default function StatusModal({
  action,
  isOpen,
  onClose,
  onConfirm,
  bonusName,
}: StatusModalProps) {
  const isPause = action === 'pause';
  const icon = isPause ? faPause : faPlay;
  const iconColor = isPause ? 'text-danger-red' : 'text-accent-green';
  const title = isPause ? 'Pause Bonus' : 'Resume Bonus';
  const confirmText = isPause ? 'Confirm Pause' : 'Confirm Resume';
  const confirmClass = isPause
    ? 'bg-danger-red hover:brightness-110'
    : 'bg-accent-green hover-glow-green';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <FontAwesomeIcon icon={icon} className={`text-4xl ${iconColor} mb-4`} />
        <CardTitle>{title}</CardTitle>
        <p className="text-text-secondary mb-6">
          Are you sure you want to {action}{' '}
          <span className="text-accent-yellow font-semibold">{bonusName}</span>?
        </p>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 border border-dark text-text-secondary hover:bg-hover-bg py-3 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${confirmClass} py-3 rounded-xl font-semibold text-text-primary transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

