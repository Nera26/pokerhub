'use client';

import { updateChartPalette } from '@/lib/api/analytics';
import { useInvalidateMutation } from './useInvalidateMutation';
import type { ChartPaletteResponse } from '@shared/types';

export function useUpdateChartPalette() {
  return useInvalidateMutation<ChartPaletteResponse, ChartPaletteResponse>({
    mutationFn: (palette) => updateChartPalette(palette),
    queryKey: ['chart-palette'],
    update: (_prev, palette) => palette,
  });
}
