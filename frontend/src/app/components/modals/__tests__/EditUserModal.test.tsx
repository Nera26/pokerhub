import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditUserModal from '../EditUserModal';

describe('EditUserModal', () => {
  it('submits updated data', async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const user = { id: 1, name: 'Bob', email: 'bob@example.com', status: 'Active' };
    render(<EditUserModal isOpen onClose={onClose} onSave={onSave} user={user} />);

    const usernameInput = screen.getByLabelText('Username');
    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, 'Jane');
    await userEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'Jane', id: 1 }),
    );
  });
});

