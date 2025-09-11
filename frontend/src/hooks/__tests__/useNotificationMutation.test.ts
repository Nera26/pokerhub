import { renderHook } from '@testing-library/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationMutation } from '@/hooks/useNotificationMutation';
import type { NotificationsResponse } from '@shared/types';

jest.mock('@tanstack/react-query');

describe('useNotificationMutation', () => {
  beforeEach(() => {
    (useMutation as jest.Mock).mockImplementation((opts) => ({
      mutate: jest.fn(),
      ...opts,
    }));
  });

  it('optimistically updates notifications and rolls back on error', async () => {
    const cancelQueries = jest.fn();
    const getQueryData = jest.fn().mockReturnValue({
      notifications: [
        {
          id: '1',
          type: 'system',
          title: 't',
          message: 'm',
          timestamp: '2024',
          read: false,
        },
      ],
    } as NotificationsResponse);
    const setQueryData = jest.fn();
    const invalidateQueries = jest.fn();
    (useQueryClient as jest.Mock).mockReturnValue({
      cancelQueries,
      getQueryData,
      setQueryData,
      invalidateQueries,
    });

    const update = jest.fn(
      (previous: NotificationsResponse, id: string): NotificationsResponse => ({
        ...previous,
        notifications: previous.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
      }),
    );

    renderHook(() =>
      useNotificationMutation((id: string) => Promise.resolve(id), update),
    );

    const opts = (useMutation as jest.Mock).mock.calls[0][0];
    const ctx = await opts.onMutate('1');
    expect(cancelQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] });
    expect(setQueryData).toHaveBeenCalledWith(['notifications'], {
      notifications: [
        {
          id: '1',
          type: 'system',
          title: 't',
          message: 'm',
          timestamp: '2024',
          read: true,
        },
      ],
    });
    opts.onError(new Error('err'), '1', ctx);
    expect(setQueryData).toHaveBeenLastCalledWith(
      ['notifications'],
      ctx.previous,
    );
    opts.onSettled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['notifications'],
    });
  });
});
