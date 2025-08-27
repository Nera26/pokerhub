import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SmoothButton from '@/app/components/ui/SmoothButton';

describe('SmoothButton', () => {
  it('renders with accessible role, label, and default styles', async () => {
    render(<SmoothButton>Click me</SmoothButton>);
    const button = await screen.findByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass(
      'hover:will-change-transform',
      'motion-safe:transition-transform',
      'motion-reduce:transition-none',
    );
  });

  it('responds to hover and tap interactions', async () => {
    const user = userEvent.setup();
    render(<SmoothButton>Interact</SmoothButton>);
    const button = await screen.findByRole('button', { name: 'Interact' });

    await user.hover(button);
    await waitFor(() => expect(button.style.transform).toContain('1.02'));

    await user.unhover(button);
    await waitFor(() =>
      expect(
        button.style.transform === '' || button.style.transform === 'none',
      ).toBe(true),
    );

    await user.pointer([{ keys: '[MouseLeft>]', target: button }]);
    await waitFor(() => expect(button.style.transform).toContain('0.97'));
    await user.pointer([{ keys: '[/MouseLeft]', target: button }]);
  });
});
