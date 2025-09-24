import { renderHook } from '@testing-library/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useMarkMessageRead,
  useReplyMessage,
} from '@/hooks/useAdminMessageActions';
import { markMessageRead } from '@/lib/api/messages';

jest.mock('@tanstack/react-query');
jest.mock('@/lib/api/messages', () => ({
  replyMessage: jest.fn(),
  markMessageRead: jest.fn(),
}));

describe('useReplyMessage', () => {
  beforeEach(() => {
    (useMutation as jest.Mock).mockClear();
    (useMutation as jest.Mock).mockImplementation((opts) => ({
      mutate: jest.fn(),
      ...opts,
    }));
  });

  it('invalidates admin-messages on settle without optimistic handlers', async () => {
    const invalidateQueries = jest.fn();
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries });

    renderHook(() => useReplyMessage());
    const opts = (useMutation as jest.Mock).mock.calls[0][0];
    expect(opts.onMutate).toBeUndefined();
    expect(opts.onError).toBeUndefined();
    await opts.onSettled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin-messages'],
    });
  });
});

describe('useMarkMessageRead', () => {
  beforeEach(() => {
    (markMessageRead as jest.Mock).mockClear();
    (markMessageRead as jest.Mock).mockResolvedValue(undefined);
    (useMutation as jest.Mock).mockClear();
    (useMutation as jest.Mock).mockImplementation((opts) => ({
      mutate: jest.fn(),
      ...opts,
    }));
  });

  it('calls markMessageRead and invalidates admin-messages', async () => {
    const invalidateQueries = jest.fn();
    (useQueryClient as jest.Mock).mockReturnValue({ invalidateQueries });

    renderHook(() => useMarkMessageRead());
    const opts = (useMutation as jest.Mock).mock.calls[0][0];

    await opts.mutationFn(3);
    expect(markMessageRead).toHaveBeenCalledWith(3);

    await opts.onSettled();
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['admin-messages'],
    });
  });
});
