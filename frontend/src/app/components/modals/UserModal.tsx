'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import UserForm, { type UserFormValues } from '../forms/UserForm';
import FormModal from './FormModal';

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
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg',
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
        key={isEdit ? user?.id : undefined}
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
