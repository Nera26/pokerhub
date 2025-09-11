import { renderHook } from '@testing-library/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReplyMessage } from '@/hooks/useAdminMessageActions';

jest.mock('@tanstack/react-query');

describe('useReplyMessage', () => {
  beforeEach(() => {
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
