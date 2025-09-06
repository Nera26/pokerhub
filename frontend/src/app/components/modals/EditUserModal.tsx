'use client';

import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import UserForm, { type UserFormValues } from '../forms/UserForm';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'Active' | 'Frozen' | 'Banned';
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updated: UserFormValues & { id: number }) => void;
};

export default function EditUserModal({ isOpen, onClose, user, onSave }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-dark px-6 py-4">
        <h3 className="text-xl font-bold">Edit User - {user?.name ?? 'Player'}</h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 grid place-items-center rounded-xl text-text-secondary hover:bg-hover-bg"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <UserForm
        key={user.id}
        defaultValues={{
          username: user.name,
          email: user.email,
          role: 'Player',
          country: '',
          status: user.status,
        }}
        submitLabel="Save"
        onSubmit={(data) => {
          onSave({ ...data, id: user.id });
          onClose();
        }}
        onCancel={onClose}
        showRole
        showCountry
        submitClassName="bg-accent-green hover:bg-green-600"
      />
    </Modal>
  );
}

