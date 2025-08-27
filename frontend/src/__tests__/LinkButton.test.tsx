import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LinkButton from '@/app/components/ui/LinkButton';

const push = jest.fn();
const prefetch = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, prefetch }),
}));

describe('LinkButton', () => {
  beforeEach(() => {
    push.mockClear();
    prefetch.mockClear();
  });

  it('has accessible role, label and navigates on click', async () => {
    const user = userEvent.setup();
    render(<LinkButton href="/dashboard">Go</LinkButton>);
    const button = await screen.findByRole('button', { name: 'Go' });

    expect(prefetch).toHaveBeenCalledWith('/dashboard');

    await user.click(button);
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('responds to hover and tap interactions', async () => {
    const user = userEvent.setup();
    render(<LinkButton href="/dashboard">Hover me</LinkButton>);
    const button = await screen.findByRole('button', { name: 'Hover me' });

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
