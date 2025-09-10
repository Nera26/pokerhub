'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import UserForm, { type UserFormValues } from '../forms/UserForm';
import FormModal from './FormModal';
import { fetchDefaultAvatar } from '@/lib/api/users';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'Active' | 'Frozen' | 'Banned';
}

type Props = {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  onSubmit: (values: UserFormValues & { id?: number }) => void;
  error?: string | null;
};

export default function UserModal({
  mode,
  isOpen,
  onClose,
  user,
  onSubmit,
  error,
}: Props) {
  const isEdit = mode === 'edit';

  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (!isEdit && isOpen) {
      fetchDefaultAvatar().then((res) => setAvatar(res.url));
    }
  }, [isEdit, isOpen]);

  const defaultValues = isEdit
    ? {
        username: user?.name ?? '',
        email: user?.email ?? '',
        role: 'Player',
        country: '',
        status: user?.status ?? 'Active',
      }
    : {
        username: '',
        email: '',
        password: '',
        status: 'Active',
        avatar,
      };

  const submitLabel = isEdit ? (
    'Save'
  ) : (
    <>
      <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
      Create User
    </>
  );

  const submitClassName = isEdit
    ? 'bg-accent-green hover:bg-green-600'
    : 'bg-accent-blue hover:bg-blue-600';

  const title = isEdit
    ? `Edit User - ${user?.name ?? 'Player'}`
    : 'Add New User';

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={title} error={error}>
      <UserForm
        key={isEdit ? user?.id : avatar}
        defaultValues={defaultValues}
        submitLabel={submitLabel}
        onSubmit={(data) => {
          if (isEdit && user) {
            onSubmit({ ...data, id: user.id });
          } else {
            onSubmit(data);
          }
        }}
        onCancel={onClose}
        showPassword={!isEdit}
        showAvatar={!isEdit}
        showRole={isEdit}
        showCountry={isEdit}
        submitClassName={submitClassName}
      />
    </FormModal>
  );
}
