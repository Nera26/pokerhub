import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tooltip from '@/app/components/ui/Tooltip';

describe('Tooltip', () => {
  it('shows and hides on hover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip text="Info">
        <button>Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const tip = screen.getByRole('tooltip');
    expect(tip.className).toContain('opacity-0');
    await act(async () => {
      await user.hover(trigger);
    });
    expect(tip.className).toContain('opacity-100');
    await act(async () => {
      await user.unhover(trigger);
    });
    expect(tip.className).toContain('opacity-0');
  });

  it('does not show when unhovered before delay expires', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <Tooltip text="Info" delay={500}>
        <button>Trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const tip = screen.getByRole('tooltip');
    expect(tip.className).toContain('opacity-0');
    await user.hover(trigger);
    await user.unhover(trigger);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(tip.className).toContain('opacity-0');
    jest.useRealTimers();
  });
});
