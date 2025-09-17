import { waitFor } from '@testing-library/react';
import { renderHookWithClient } from './utils/renderHookWithClient';
import { useRevenueBreakdown } from '../useRevenueBreakdown';
import { RevenueBreakdownSchema } from '@shared/types';
import { apiClient, type ApiError } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => {
  const actual = jest.requireActual('@/lib/api/client');
  return {
    ...actual,
    apiClient: jest.fn(),
  };
});

const apiClientMock = apiClient as jest.MockedFunction<typeof apiClient>;

describe('useRevenueBreakdown', () => {
  afterEach(() => {
    jest.resetAllMocks();
    apiClientMock.mockReset();
  });

  it('reports loading state', () => {
    apiClientMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHookWithClient(() => useRevenueBreakdown('all'));
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data on success', async () => {
    apiClientMock.mockResolvedValue(
      RevenueBreakdownSchema.parse({
        currency: 'usd',
        streams: [{ label: 'Cash', pct: 100, value: 200 }],
      }),
    );
    const { result } = renderHookWithClient(() => useRevenueBreakdown('all'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.streams[0].label).toBe('Cash');
    expect(result.current.data?.currency).toBe('USD');
  });

  it('exposes error state', async () => {
    apiClientMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHookWithClient(() => useRevenueBreakdown('all'));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch revenue breakdown: boom',
    );
  });
});
