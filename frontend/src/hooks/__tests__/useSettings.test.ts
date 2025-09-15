import { waitFor } from '@testing-library/react';
import { renderHookWithClient } from './utils/renderHookWithClient';
import { useSettings } from '../useSettings';
import { fetchDefaultAvatar } from '@/lib/api';
import type { ApiError } from '@/lib/api/client';

jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  fetchDefaultAvatar: jest.fn(),
}));

describe('useSettings', () => {
  it('returns default avatar on success', async () => {
    (fetchDefaultAvatar as jest.Mock).mockResolvedValue({
      url: 'https://example.com/avatar.png',
    });

    const { result } = renderHookWithClient(() => useSettings());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.url).toBe('https://example.com/avatar.png');
    expect(fetchDefaultAvatar).toHaveBeenCalled();
  });

  it('exposes error state', async () => {
    (fetchDefaultAvatar as jest.Mock).mockRejectedValue(new Error('fail'));

    const { result } = renderHookWithClient(() => useSettings());
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch settings: fail',
    );
  });
});
