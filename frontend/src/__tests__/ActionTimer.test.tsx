import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import ActionTimer from '@/app/components/tables/ActionTimer';
import { getServerTime, setServerTime } from '@/lib/server-time';

describe('ActionTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down using server clock', () => {
    let now = 0;
    const originalNow = Date.now;
    // Mock Date.now so getServerTime can build off it
    Date.now = () => now;

    // Simulate server:Clock event
    setServerTime(1000);

    const deadline = getServerTime() + 3000; // 3 seconds from now
    render(<ActionTimer deadline={deadline} />);

    const timer = screen.getByTestId('action-timer');
    expect(timer.textContent).toBe('3');

    act(() => {
      now += 1000;
      jest.advanceTimersByTime(1000);
    });
    expect(timer.textContent).toBe('2');

    act(() => {
      now += 2000;
      jest.advanceTimersByTime(2000);
    });
    expect(timer.textContent).toBe('0');

    Date.now = originalNow;
  });
});

