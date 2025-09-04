import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../app/components/ui/Button';
import Modal from '../app/components/ui/Modal';
import Tooltip from '../app/components/ui/Tooltip';
import ToastNotification from '../app/components/ui/ToastNotification';

describe('UI accessibility', () => {
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

  // TopProgressBar component deprecated; corresponding accessibility test removed.
});
