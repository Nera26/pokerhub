import { fetchLogTypeClasses } from '@/lib/api/analytics';
import { safeApiClient } from '@/lib/api/utils';
import { LogTypeClassesSchema } from '@shared/types';

jest.mock('@/lib/api/utils', () => ({ safeApiClient: jest.fn() }));

const safeApiClientMock = safeApiClient as jest.Mock;

describe('fetchLogTypeClasses', () => {
  it('calls safeApiClient with correct arguments', async () => {
    safeApiClientMock.mockResolvedValue({});
    await fetchLogTypeClasses();
    expect(safeApiClientMock).toHaveBeenCalledWith(
      '/api/admin/log-types',
      LogTypeClassesSchema,
      { errorMessage: 'Failed to fetch log type classes' },
    );
  });
});
