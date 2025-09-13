import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateChartPalette } from '../useUpdateChartPalette';
import { updateChartPalette } from '@/lib/api/analytics';

jest.mock('@/lib/api/analytics', () => ({
  updateChartPalette: jest.fn().mockResolvedValue(['#000000']),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useUpdateChartPalette', () => {
  it('calls updateChartPalette', async () => {
    const { result } = renderHook(() => useUpdateChartPalette(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(['#123']);
    });
    expect(updateChartPalette).toHaveBeenCalledWith(['#123']);
  });
});
