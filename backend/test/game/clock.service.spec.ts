import { ClockService } from '../../src/game/clock.service';

describe('ClockService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires timer callback only once', () => {
    const clock = new ClockService();
    const cb = jest.fn();
    clock.setTimer('p1', 't1', 10, cb);

    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(1000);

    expect(cb).toHaveBeenCalledTimes(1);

    clock.onModuleDestroy();
  });

  it('clearTimer cancels callbacks', () => {
    const clock = new ClockService();
    const cb = jest.fn();
    clock.setTimer('p1', 't1', 10, cb);
    clock.clearTimer('p1', 't1');

    jest.advanceTimersByTime(2000);

    expect(cb).not.toHaveBeenCalled();

    clock.onModuleDestroy();
  });

  it('onTick receives monotonic timestamps', () => {
    const clock = new ClockService();
    const ticks: bigint[] = [];
    clock.onTick((t) => ticks.push(t));

    jest.advanceTimersByTime(3000);

    expect(ticks.length).toBe(3);
    expect(ticks[1] > ticks[0]).toBe(true);
    expect(ticks[2] > ticks[1]).toBe(true);

    clock.onModuleDestroy();
  });
});

