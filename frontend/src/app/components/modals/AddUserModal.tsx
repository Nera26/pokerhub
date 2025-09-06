'use client';

import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import UserForm, { type UserFormValues } from '../forms/UserForm';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (values: UserFormValues) => void;
};

export default function AddUserModal({ isOpen, onClose, onAdd }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between p-0 border-b border-dark pb-4 mb-4">
        <h3 className="text-xl font-bold">Add New User</h3>
        <button
          aria-label="Close"
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary text-xl"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <UserForm
        defaultValues={{
          username: '',
          email: '',
          password: '',
          status: 'Active',
          avatar:
            'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
        }}
        submitLabel={
          <>
            <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
            Create User
          </>
        }
        submitClassName="bg-accent-blue hover:bg-blue-600"
        onSubmit={(data) => {
          onAdd(data);
          onClose();
        }}
        onCancel={onClose}
        showPassword
        showAvatar
      />
    </Modal>
  );
}

