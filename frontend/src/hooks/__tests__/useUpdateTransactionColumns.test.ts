import { act, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import useUpdateTransactionColumns from '@/hooks/useUpdateTransactionColumns';
import { TRANSACTION_COLUMNS_QUERY_KEY } from '@/hooks/useTransactionColumns';
import { updateTransactionColumns } from '@/lib/api/transactions';
import { renderHookWithClient } from './utils/renderHookWithClient';

jest.mock('@/lib/api/transactions');

describe('useUpdateTransactionColumns', () => {
  const updateMock = updateTransactionColumns as jest.Mock;

  const createClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('optimistically updates cache and syncs with server response', async () => {
    const queryClient = createClient();
    const previous = [{ id: 'date', label: 'Date' }];
    queryClient.setQueryData([TRANSACTION_COLUMNS_QUERY_KEY], previous);

    let resolveMutation: (value: unknown) => void = () => {};
    updateMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMutation = resolve;
        }),
    );

    const { result } = renderHookWithClient(
      () => useUpdateTransactionColumns(),
      queryClient,
    );

    const updated = [
      { id: 'amount', label: 'Amount' },
      { id: 'status', label: 'Status' },
    ];
    const serverResponse = [
      { id: 'amount', label: 'Amount (USD)' },
      { id: 'status', label: 'Status' },
    ];

    await act(async () => {
      const promise = result.current.mutateAsync(updated);
      await waitFor(() => {
        expect(
          queryClient.getQueryData([TRANSACTION_COLUMNS_QUERY_KEY]),
        ).toEqual(updated);
      });
      resolveMutation(serverResponse);
      await promise;
    });

    expect(queryClient.getQueryData([TRANSACTION_COLUMNS_QUERY_KEY])).toEqual(
      serverResponse,
    );
  });

  it('reverts to previous configuration when mutation fails', async () => {
    const queryClient = createClient();
    const previous = [
      { id: 'date', label: 'Date' },
      { id: 'type', label: 'Type' },
    ];
    queryClient.setQueryData([TRANSACTION_COLUMNS_QUERY_KEY], previous);

    let rejectMutation: (reason?: unknown) => void = () => {};
    updateMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectMutation = reject;
        }),
    );

    const { result } = renderHookWithClient(
      () => useUpdateTransactionColumns(),
      queryClient,
    );

    const updated = [
      { id: 'amount', label: 'Amount' },
      { id: 'status', label: 'Status' },
    ];

    await act(async () => {
      const promise = result.current.mutateAsync(updated);
      await waitFor(() => {
        expect(
          queryClient.getQueryData([TRANSACTION_COLUMNS_QUERY_KEY]),
        ).toEqual(updated);
      });
      rejectMutation(new Error('failed to save'));
      await expect(promise).rejects.toThrow('failed to save');
    });

    expect(queryClient.getQueryData([TRANSACTION_COLUMNS_QUERY_KEY])).toEqual(
      previous,
    );
  });
});
