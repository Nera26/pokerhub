import { render, screen, fireEvent, act } from '@testing-library/react';
import Avatar from '../app/components/ui/Avatar';
import { Button } from '../app/components/ui/Button';
import Modal from '../app/components/ui/Modal';
import Tooltip from '../app/components/ui/Tooltip';
import ToastNotification from '../app/components/ui/ToastNotification';
import TopProgressBar from '../app/components/ui/TopProgressBar';
import { useTopLoader } from 'nextjs-toploader';

describe('UI accessibility', () => {
  it('renders Avatar with accessible label', () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('supports icon-only Button with aria-label', () => {
    render(
      <Button aria-label="settings" leftIcon={<svg data-testid="icon" />} />,
    );
    expect(
      screen.getByRole('button', { name: 'settings' }),
    ).toBeInTheDocument();
  });

  it('Modal exposes dialog role and handles Escape', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('Tooltip links trigger and tooltip via aria-describedby', () => {
    render(<Tooltip text="More info">trigger</Tooltip>);
    const trigger = screen.getByText('trigger');
    fireEvent.focus(trigger);
    const tip = screen.getByRole('tooltip');
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
  });

  it('ToastNotification uses appropriate live region', () => {
    const { rerender } = render(
      <ToastNotification
        message="saved"
        type="success"
        isOpen
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(
      <ToastNotification
        message="error"
        type="error"
        isOpen
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('TopProgressBar renders when started', () => {
    let loader: ReturnType<typeof useTopLoader>;
    function Capture() {
      loader = useTopLoader();
      return null;
    }

    render(
      <>
        <TopProgressBar />
        <Capture />
      </>,
    );

    act(() => {
      loader.start();
    });
    expect(document.getElementById('nprogress')).toBeInTheDocument();
    act(() => {
      loader.done();
    });
  });
});
