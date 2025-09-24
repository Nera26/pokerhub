import { waitFor } from '@testing-library/react';
import { useAuditLogTypes, useAuditLogTypeClasses } from '../lookups';
import { apiClient, type ApiError } from '@/lib/api/client';
import { renderHookWithClient } from './utils/renderHookWithClient';

jest.mock('@/lib/api/client', () => {
  const actual = jest.requireActual('@/lib/api/client');
  return {
    ...actual,
    apiClient: jest.fn(),
  };
});

const apiClientMock = apiClient as unknown as jest.MockedFunction<
  typeof apiClient
>;

describe('useAuditLogTypes', () => {
  afterEach(() => {
    jest.resetAllMocks();
    apiClientMock.mockReset();
  });

  it('requires no arguments', () => {
    expect(useAuditLogTypes.length).toBe(2);
  });

  it('reports loading state', () => {
    apiClientMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHookWithClient(() => useAuditLogTypes());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns types on success', async () => {
    apiClientMock.mockResolvedValueOnce({ types: ['Login'] });
    const { result } = renderHookWithClient(() => useAuditLogTypes());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.types).toEqual(['Login']);
  });

  it('exposes error state', async () => {
    apiClientMock.mockRejectedValueOnce({ message: 'fail' } as ApiError);
    const { result } = renderHookWithClient(() => useAuditLogTypes());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch analytics log types: fail',
    );
  });
});

describe('useAuditLogTypeClasses', () => {
  afterEach(() => {
    jest.resetAllMocks();
    apiClientMock.mockReset();
  });

  it('requires no arguments', () => {
    expect(useAuditLogTypeClasses.length).toBe(2);
  });

  it('reports loading state', () => {
    apiClientMock.mockReturnValue(new Promise(() => {}));
    const { result } = renderHookWithClient(() => useAuditLogTypeClasses());
    expect(result.current.isLoading).toBe(true);
  });

  it('returns classes on success', async () => {
    apiClientMock.mockResolvedValueOnce({ Login: 'bg-green-500' });
    const { result } = renderHookWithClient(() => useAuditLogTypeClasses());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.Login).toBe('bg-green-500');
  });

  it('exposes error state', async () => {
    apiClientMock.mockRejectedValueOnce({ message: 'fail' } as ApiError);
    const { result } = renderHookWithClient(() => useAuditLogTypeClasses());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch analytics log types classes: fail',
    );
  });
});
