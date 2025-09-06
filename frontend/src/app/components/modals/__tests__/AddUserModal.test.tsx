import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddUserModal from '../AddUserModal';

describe('AddUserModal', () => {
  it('submits form data', async () => {
    const onAdd = jest.fn();
    const onClose = jest.fn();
    render(<AddUserModal isOpen onClose={onClose} onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByText('Create User'));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'alice',
        email: 'alice@example.com',
        password: 'secret',
        status: 'Active',
      }),
    );
  });
});

