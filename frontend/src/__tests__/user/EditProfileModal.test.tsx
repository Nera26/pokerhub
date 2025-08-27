import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditProfileModal, {
  EditProfileData,
} from '@/app/components/user/EditProfileModal';

describe('EditProfileModal', () => {
  it('submits edited profile data', async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const user = userEvent.setup();

    render(<EditProfileModal isOpen onClose={onClose} onSave={onSave} />);

    // Accessibility: labels and aria attributes
    const closeButton = screen.getByRole('button', {
      name: 'Close edit profile modal',
    });
    expect(closeButton).toHaveAttribute(
      'aria-label',
      'Close edit profile modal',
    );
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Bank Account Number')).toBeInTheDocument();

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(fileInput, file);

    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'NewUser');
    await user.clear(screen.getByLabelText('Email Address'));
    await user.type(screen.getByLabelText('Email Address'), 'new@example.com');
    await user.clear(screen.getByLabelText('Bank Account Number'));
    await user.type(screen.getByLabelText('Bank Account Number'), '5678');

    const bioTextarea = document.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    await user.clear(bioTextarea);
    await user.type(bioTextarea, 'New bio');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const expected: EditProfileData = {
      avatar: file,
      username: 'NewUser',
      email: 'new@example.com',
      bank: '5678',
      bio: 'New bio',
    };

    expect(onSave).toHaveBeenCalledWith(expected);
    expect(onClose).toHaveBeenCalled();
  });
});
