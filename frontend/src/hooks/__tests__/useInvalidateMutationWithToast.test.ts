import { renderHook } from '@testing-library/react';
import { useInvalidateMutationWithToast } from '@/hooks/useInvalidateMutationWithToast';
import { useInvalidateMutation } from '@/hooks/useInvalidateMutation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationsResponse } from '@shared/types';

jest.mock('@/hooks/useInvalidateMutation');
jest.mock('@tanstack/react-query');

describe('useInvalidateMutationWithToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('wraps mutate functions with success and error toasts', async () => {
    const base = {
      mutate: jest.fn(),
      mutateAsync: jest.fn().mockResolvedValue(undefined),
    };
    (useInvalidateMutation as jest.Mock).mockReturnValue(base);
    const setToast = jest.fn();

    const { result } = renderHook(() =>
      useInvalidateMutationWithToast({
        mutationFn: jest.fn(),
        queryKey: ['q'],
        toastOpts: {
          success: (v: { id: number }) => `ok ${v.id}`,
          error: 'err',
          setToast,
        },
      }),
    );

    const vars = { id: 1 };
    (base.mutate as jest.Mock).mockImplementation((_v, opts) => {
      opts.onError(new Error('fail'), vars, undefined);
      opts.onSuccess(undefined, vars, undefined);
    });
    result.current.mutate(vars);
    await result.current.mutateAsync(vars);

    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'err',
      type: 'error',
    });
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'ok 1',
      type: 'success',
    });
  });

  it('invalidates cache on settled', async () => {
    const actual = jest.requireActual('@/hooks/useInvalidateMutation');
    (useInvalidateMutation as jest.Mock).mockImplementation(
      actual.useInvalidateMutation,
    );
    const cancelQueries = jest.fn();
    const getQueryData = jest
      .fn()
      .mockReturnValue({ notifications: [] } as NotificationsResponse);
    const setQueryData = jest.fn();
    const invalidateQueries = jest.fn();
    (useQueryClient as jest.Mock).mockReturnValue({
      cancelQueries,
      getQueryData,
      setQueryData,
      invalidateQueries,
    });

    let opts: any;
    (useMutation as jest.Mock).mockImplementation((o) => {
      opts = o;
      return { mutate: jest.fn() };
    });

    renderHook(() =>
      useInvalidateMutationWithToast({
        mutationFn: (id: string) => Promise.resolve(id),
        queryKey: ['notifications'],
        update: (prev: NotificationsResponse, id: string) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        }),
      }),
    );

    const ctx = await opts.onMutate('1');
    opts.onError(new Error('e'), '1', ctx);
    opts.onSettled();

    expect(cancelQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['notifications'],
    });
    expect(setQueryData).toHaveBeenCalledTimes(2);
  });
});
