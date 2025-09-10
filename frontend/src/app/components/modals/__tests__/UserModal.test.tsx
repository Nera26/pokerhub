import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserModal from '../UserModal';
import { fetchDefaultAvatar } from '@/lib/api/users';

jest.mock('@/lib/api/users', () => ({
  fetchDefaultAvatar: jest.fn(),
}));

describe('UserModal', () => {
  it('submits form data in add mode', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    (fetchDefaultAvatar as jest.Mock).mockResolvedValue({
      url: 'https://example.com/avatar.jpg',
    });
    render(
      <UserModal mode="add" isOpen onClose={onClose} onSubmit={onSubmit} />,
    );

    await waitFor(() =>
      expect(
        screen.getByDisplayValue('https://example.com/avatar.jpg'),
      ).toBeInTheDocument(),
    );
    expect(fetchDefaultAvatar).toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Username'), 'alice');
    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret');
    await userEvent.click(screen.getByText('Create User'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'alice',
        email: 'alice@example.com',
        password: 'secret',
        status: 'Active',
        avatar: 'https://example.com/avatar.jpg',
      }),
    );
  });

  it('submits updated data in edit mode', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const user = {
      id: 1,
      name: 'Bob',
      email: 'bob@example.com',
      status: 'Active',
    };
    render(
      <UserModal
        mode="edit"
        isOpen
        onClose={onClose}
        user={user}
        onSubmit={onSubmit}
      />,
    );

    const usernameInput = screen.getByLabelText('Username');
    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, 'Jane');
    await userEvent.click(screen.getByText('Save'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'Jane', id: 1 }),
    );
  });

  it('calls onClose when close button clicked', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    render(
      <UserModal mode="add" isOpen onClose={onClose} onSubmit={onSubmit} />,
    );

    await userEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
