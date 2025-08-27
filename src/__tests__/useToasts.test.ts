import { renderHook, act } from '@testing-library/react';
import useToasts from '@/hooks/useToasts';

describe('useToasts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('supports custom durations and variants', () => {
    const { result } = renderHook(() => useToasts());
    act(() => {
      result.current.pushToast('short', { duration: 1000, variant: 'success' });
      result.current.pushToast('long', { duration: 5000, variant: 'error' });
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'short',
      variant: 'success',
    });
    expect(result.current.toasts[1]).toMatchObject({
      message: 'long',
      variant: 'error',
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: 'long',
      variant: 'error',
    });

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});
