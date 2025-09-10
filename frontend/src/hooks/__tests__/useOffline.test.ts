import { act, renderHook } from '@testing-library/react';
import useOffline from '../useOffline';

describe('useOffline', () => {
  const reloadMock = jest.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, reload: reloadMock },
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation });
    reloadMock.mockClear();
  });

  it('tracks online status and responds to events', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
    const { result } = renderHook(() => useOffline());
    expect(result.current.online).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.online).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.online).toBe(true);
  });

  it('reloads when online on retry', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
    const { result } = renderHook(() => useOffline());
    result.current.retry();
    expect(reloadMock).toHaveBeenCalled();
  });

  it('does not reload when offline on retry', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });
    const { result } = renderHook(() => useOffline());
    result.current.retry();
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
