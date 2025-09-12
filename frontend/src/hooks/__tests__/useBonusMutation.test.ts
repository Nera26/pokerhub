import { renderHook } from '@testing-library/react';
import { useInvalidateMutation } from '@/hooks/useInvalidateMutation';
import useBonusMutation from '@/hooks/useBonusMutation';

jest.mock('@/hooks/useInvalidateMutation');

const baseBonus = {
  id: 1,
  name: 'Test Bonus',
  type: 'deposit',
  description: 'desc',
  eligibility: 'all',
  status: 'active',
  claimsTotal: 0,
};

describe('useBonusMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setup<T>(options: any) {
    const calls: any[] = [];
    (useInvalidateMutation as jest.Mock).mockImplementation((opts) => {
      calls.push(opts);
      return {
        mutate: (_vars: T, mutateOpts: any) => {
          calls.push(mutateOpts);
        },
        mutateAsync: (_vars: T, mutateOpts: any) => {
          calls.push(mutateOpts);
          return Promise.resolve();
        },
      };
    });
    const setToast = jest.fn();
    const { result } = renderHook(() =>
      useBonusMutation<T>({ ...options, setToast }),
    );
    return { result, setToast, calls };
  }

  it('handles create with cache update and toasts', () => {
    const { result, setToast, calls } = setup<{ name: string }>({
      mutationFn: jest.fn(),
      updateCache: (prev: any[], bonus: any) => [{ ...bonus, id: 2 }],
      successToast: 'Promotion created',
      errorToast: 'Failed to create bonus',
    });
    const vars = { name: 'New' };
    expect(calls[0]).toMatchObject({ queryKey: ['admin-bonuses'] });
    expect(calls[0].update([], vars)).toEqual([{ name: 'New', id: 2 }]);
    result.current.mutate(vars);
    const mutateOpts = calls[1];
    mutateOpts.onError(new Error('err'), vars);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Failed to create bonus',
      type: 'error',
    });
    mutateOpts.onSuccess(undefined, vars);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Promotion created',
      type: 'success',
    });
  });

  it('handles update with cache update and toasts', () => {
    const { result, setToast, calls } = setup<{ id: number; data: any }>({
      mutationFn: jest.fn(),
      updateCache: (prev: any[], { id, data }) =>
        prev.map((b) => (b.id === id ? { ...b, ...data } : b)),
      successToast: 'Changes saved',
      errorToast: 'Failed to update bonus',
    });
    const vars = { id: 1, data: { status: 'paused' } };
    expect(calls[0].update([baseBonus], vars)).toEqual([
      { ...baseBonus, status: 'paused' },
    ]);
    result.current.mutate(vars);
    const mutateOpts = calls[1];
    mutateOpts.onError(new Error('err'), vars);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Failed to update bonus',
      type: 'error',
    });
    mutateOpts.onSuccess(undefined, vars);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Changes saved',
      type: 'success',
    });
  });

  it('handles delete with cache update and toasts', () => {
    const { result, setToast, calls } = setup<number>({
      mutationFn: jest.fn(),
      updateCache: (prev: any[], id: number) => prev.filter((b) => b.id !== id),
      successToast: 'Deleted bonus',
      errorToast: 'Failed to delete bonus',
    });
    expect(calls[0].update([baseBonus], 1)).toEqual([]);
    result.current.mutate(1);
    const mutateOpts = calls[1];
    mutateOpts.onError(new Error('err'), 1);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Failed to delete bonus',
      type: 'error',
    });
    mutateOpts.onSuccess(undefined, 1);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Deleted bonus',
      type: 'success',
    });
  });

  it('handles toggle with dynamic success toast', () => {
    const { result, setToast, calls } = setup<{
      id: number;
      status: string;
      name: string;
    }>({
      mutationFn: jest.fn(),
      updateCache: (prev: any[], { id, status }) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b)),
      successToast: ({ status, name }) =>
        status === 'paused' ? `Paused "${name}"` : `Resumed "${name}"`,
      errorToast: 'Failed to update bonus',
    });
    const vars = { id: 1, status: 'paused', name: 'Test Bonus' };
    expect(calls[0].update([baseBonus], vars)).toEqual([
      { ...baseBonus, status: 'paused' },
    ]);
    result.current.mutate(vars);
    const mutateOpts = calls[1];
    mutateOpts.onError(new Error('err'), vars);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Failed to update bonus',
      type: 'error',
    });
    mutateOpts.onSuccess(undefined, vars);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Paused "Test Bonus"',
      type: 'success',
    });
  });

  it('emits toasts for mutateAsync', async () => {
    const { result, setToast, calls } = setup<{ name: string }>({
      mutationFn: jest.fn(),
      updateCache: (prev: any[], bonus: any) => [{ ...bonus, id: 2 }],
      successToast: 'Promotion created',
      errorToast: 'Failed to create bonus',
    });
    const vars = { name: 'Async' };
    await result.current.mutateAsync(vars);
    const mutateOpts = calls[1];
    mutateOpts.onError(new Error('err'), vars);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Failed to create bonus',
      type: 'error',
    });
    mutateOpts.onSuccess(undefined, vars);
    expect(setToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Promotion created',
      type: 'success',
    });
  });
});
