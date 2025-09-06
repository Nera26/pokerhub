import { renderHook } from '@testing-library/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useBonusMutation from '@/hooks/useBonusMutation';

jest.mock('@tanstack/react-query');

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
    (useMutation as jest.Mock).mockImplementation((opts) => ({ mutate: jest.fn(), ...opts }));
  });

  function setupClient(previous: any[]) {
    const setQueryData = jest.fn();
    const invalidateQueries = jest.fn();
    (useQueryClient as jest.Mock).mockReturnValue({
      cancelQueries: jest.fn(),
      getQueryData: jest.fn().mockReturnValue(previous),
      setQueryData,
      invalidateQueries,
    });
    return { setQueryData, invalidateQueries };
  }

  it('handles create with cache update and rollback', async () => {
    const { setQueryData, invalidateQueries } = setupClient([]);
    const mutationCalls: any[] = [];
    (useMutation as jest.Mock).mockImplementation((opts) => {
      mutationCalls.push(opts);
      return { mutate: jest.fn() };
    });
    const setToast = jest.fn();
    renderHook(() =>
      useBonusMutation({
        mutationFn: jest.fn(),
        updateCache: (prev, bonus: any) => [{ ...bonus, id: 2 }],
        successToast: 'Promotion created',
        errorToast: 'Failed to create bonus',
        setToast,
      }),
    );
    const opts = mutationCalls[0];
    const ctx = await opts.onMutate({ name: 'New' });
    expect(setQueryData).toHaveBeenCalledWith(['admin-bonuses'], [{ name: 'New', id: 2 }]);
    opts.onError(new Error('err'), { name: 'New' }, ctx);
    expect(setQueryData).toHaveBeenLastCalledWith(['admin-bonuses'], ctx.previous);
    expect(setToast).toHaveBeenCalledWith({ open: true, msg: 'Failed to create bonus', type: 'error' });
    opts.onSuccess(undefined, { name: 'New' });
    expect(setToast).toHaveBeenCalledWith({ open: true, msg: 'Promotion created', type: 'success' });
    opts.onSettled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-bonuses'] });
  });

  it('handles update with cache update and rollback', async () => {
    const { setQueryData, invalidateQueries } = setupClient([baseBonus]);
    const mutationCalls: any[] = [];
    (useMutation as jest.Mock).mockImplementation((opts) => {
      mutationCalls.push(opts);
      return { mutate: jest.fn() };
    });
    const setToast = jest.fn();
    renderHook(() =>
      useBonusMutation<{ id: number; data: any }>({
        mutationFn: jest.fn(),
        updateCache: (prev, { id, data }) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)),
        successToast: 'Changes saved',
        errorToast: 'Failed to update bonus',
        setToast,
      }),
    );
    const opts = mutationCalls[0];
    const ctx = await opts.onMutate({ id: 1, data: { status: 'paused' } });
    expect(setQueryData).toHaveBeenCalledWith(['admin-bonuses'], [{ ...baseBonus, status: 'paused' }]);
    opts.onError(new Error('err'), { id: 1, data: { status: 'paused' } }, ctx);
    expect(setQueryData).toHaveBeenLastCalledWith(['admin-bonuses'], ctx.previous);
    expect(setToast).toHaveBeenCalledWith({ open: true, msg: 'Failed to update bonus', type: 'error' });
    opts.onSuccess(undefined, { id: 1, data: { status: 'paused' } });
    expect(setToast).toHaveBeenCalledWith({ open: true, msg: 'Changes saved', type: 'success' });
    opts.onSettled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-bonuses'] });
  });

  it('handles delete with cache update and rollback', async () => {
    const { setQueryData, invalidateQueries } = setupClient([baseBonus]);
    const mutationCalls: any[] = [];
    (useMutation as jest.Mock).mockImplementation((opts) => {
      mutationCalls.push(opts);
      return { mutate: jest.fn() };
    });
    const setToast = jest.fn();
    renderHook(() =>
      useBonusMutation<number>({
        mutationFn: jest.fn(),
        updateCache: (prev, id) => prev.filter((b) => b.id !== id),
        successToast: 'Deleted bonus',
        errorToast: 'Failed to delete bonus',
        setToast,
      }),
    );
    const opts = mutationCalls[0];
    const ctx = await opts.onMutate(1);
    expect(setQueryData).toHaveBeenCalledWith(['admin-bonuses'], []);
    opts.onError(new Error('err'), 1, ctx);
    expect(setQueryData).toHaveBeenLastCalledWith(['admin-bonuses'], ctx.previous);
    expect(setToast).toHaveBeenCalledWith({ open: true, msg: 'Failed to delete bonus', type: 'error' });
    opts.onSuccess(undefined, 1);
    expect(setToast).toHaveBeenCalledWith({ open: true, msg: 'Deleted bonus', type: 'success' });
    opts.onSettled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-bonuses'] });
  });

  it('handles toggle with dynamic success toast', async () => {
    const { setQueryData, invalidateQueries } = setupClient([baseBonus]);
    const mutationCalls: any[] = [];
    (useMutation as jest.Mock).mockImplementation((opts) => {
      mutationCalls.push(opts);
      return { mutate: jest.fn() };
    });
    const setToast = jest.fn();
    renderHook(() =>
      useBonusMutation<{ id: number; status: string; name: string }>({
        mutationFn: jest.fn(),
        updateCache: (prev, { id, status }) => prev.map((b) => (b.id === id ? { ...b, status } : b)),
        successToast: ({ status, name }) =>
          status === 'paused' ? `Paused "${name}"` : `Resumed "${name}"`,
        errorToast: 'Failed to update bonus',
        setToast,
      }),
    );
    const opts = mutationCalls[0];
    const vars = { id: 1, status: 'paused', name: 'Test Bonus' };
    const ctx = await opts.onMutate(vars);
    expect(setQueryData).toHaveBeenCalledWith(['admin-bonuses'], [{ ...baseBonus, status: 'paused' }]);
    opts.onError(new Error('err'), vars, ctx);
    expect(setQueryData).toHaveBeenLastCalledWith(['admin-bonuses'], ctx.previous);
    expect(setToast).toHaveBeenCalledWith({ open: true, msg: 'Failed to update bonus', type: 'error' });
    opts.onSuccess(undefined, vars);
    expect(setToast).toHaveBeenCalledWith({ open: true, msg: 'Paused "Test Bonus"', type: 'success' });
    opts.onSettled();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-bonuses'] });
  });
});

