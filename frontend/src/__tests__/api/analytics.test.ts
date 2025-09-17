import { fetchLogTypeClasses, updateChartPalette } from '@/lib/api/analytics';
import { safeApiClient } from '@/lib/api/utils';
import { apiClient } from '@/lib/api/client';
import {
  LogTypeClassesSchema,
  ChartPaletteResponseSchema,
} from '@shared/types';

jest.mock('@/lib/api/utils', () => ({ safeApiClient: jest.fn() }));
jest.mock('@/lib/api/client', () => ({ apiClient: jest.fn() }));

const safeApiClientMock = safeApiClient as jest.Mock;
const apiClientMock = apiClient as jest.Mock;

describe('fetchLogTypeClasses', () => {
  it('calls safeApiClient with correct arguments', async () => {
    safeApiClientMock.mockResolvedValue({});
    await fetchLogTypeClasses();
    expect(safeApiClientMock).toHaveBeenCalledWith(
      '/api/analytics/log-types/classes',
      LogTypeClassesSchema,
      { errorMessage: 'Failed to fetch log type classes' },
    );
  });
});

describe('updateChartPalette', () => {
  it('calls apiClient with correct arguments', async () => {
    apiClientMock.mockResolvedValue([]);
    await updateChartPalette(['#fff']);
    expect(apiClientMock).toHaveBeenCalledWith(
      '/api/settings/chart-palette',
      ChartPaletteResponseSchema,
      { method: 'PUT', body: ['#fff'], signal: undefined },
    );
  });
});
