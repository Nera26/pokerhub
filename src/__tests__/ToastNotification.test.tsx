import { render, screen, waitFor } from '@testing-library/react';
import ToastNotification from '@/app/components/ui/ToastNotification';

describe('ToastNotification', () => {
  it('renders message and auto-closes after duration', async () => {
    const onClose = jest.fn();
    global.requestAnimationFrame = (cb: FrameRequestCallback) =>
      setTimeout(cb, 0);
    render(
      <ToastNotification
        message="Saved"
        isOpen
        duration={50}
        onClose={onClose}
      />,
    );
    expect(screen.getByText('Saved')).toBeInTheDocument();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });
});
