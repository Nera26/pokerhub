import { ClockService } from '../../src/game/clock.service';
import { ConfigService } from '@nestjs/config';

describe('ClockService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires timer callback only once', () => {
    const clock = new ClockService(new ConfigService());
    const cb = jest.fn();
    clock.setTimer('p1', 't1', cb, 10);

    jest.advanceTimersByTime(1000);
    jest.advanceTimersByTime(1000);

    expect(cb).toHaveBeenCalledTimes(1);

    clock.onModuleDestroy();
  });

  it('clearTimer cancels callbacks', () => {
    const clock = new ClockService(new ConfigService());
    const cb = jest.fn();
    clock.setTimer('p1', 't1', cb, 10);
    clock.clearTimer('p1', 't1');

    jest.advanceTimersByTime(2000);

    expect(cb).not.toHaveBeenCalled();

    clock.onModuleDestroy();
  });

  it('onTick receives monotonic timestamps', () => {
    const clock = new ClockService(new ConfigService());
    const ticks: bigint[] = [];
    clock.onTick((t) => ticks.push(t));

    jest.advanceTimersByTime(3000);

    expect(ticks.length).toBe(3);
    expect(ticks[1] > ticks[0]).toBe(true);
    expect(ticks[2] > ticks[1]).toBe(true);

    clock.onModuleDestroy();
  });

  it('uses default timeout from config when ms omitted', () => {
    const config = new ConfigService({ game: { actionTimeoutMs: 500 } });
    const clock = new ClockService(config);
    const cb = jest.fn();
    clock.setTimer('p1', 't1', cb);

    jest.advanceTimersByTime(499);
    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);

    clock.onModuleDestroy();
  });
});

