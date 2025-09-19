import { waitFor } from '@testing-library/react';
import { fetchBlockedCountries } from '@/lib/api/blockedCountries';
import { useBlockedCountries } from '../useBlockedCountries';
import { renderHookWithClient } from './utils/renderHookWithClient';

jest.mock('@/lib/api/blockedCountries');

const mockedFetchBlockedCountries =
  fetchBlockedCountries as jest.MockedFunction<typeof fetchBlockedCountries>;

describe('useBlockedCountries', () => {
  beforeEach(() => {
    mockedFetchBlockedCountries.mockResolvedValue([]);
  });

  afterEach(() => {
    mockedFetchBlockedCountries.mockReset();
  });

  it('delegates fetching to fetchBlockedCountries', async () => {
    const { result } = renderHookWithClient(() => useBlockedCountries());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedFetchBlockedCountries).toHaveBeenCalledTimes(1);
    expect(mockedFetchBlockedCountries).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});
