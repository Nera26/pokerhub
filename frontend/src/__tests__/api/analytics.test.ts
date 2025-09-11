import { fetchLogTypeClasses } from '@/lib/api/analytics';
import { apiClient } from '@/lib/api/client';
import { LogTypeClassesSchema } from '@shared/types';

jest.mock('@/lib/api/client', () => ({ apiClient: jest.fn() }));

const apiClientMock = apiClient as jest.Mock;

describe('fetchLogTypeClasses', () => {
  it('calls apiClient with correct arguments', async () => {
    apiClientMock.mockResolvedValue({});
    await fetchLogTypeClasses();
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/admin/log-types',
      LogTypeClassesSchema,
    );
  });
});
