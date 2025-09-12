'use client';

import { createQueryHook } from './createQueryHook';
import {
  ChartPaletteResponseSchema,
  type ChartPaletteResponse,
} from '@shared/types';

export const useChartPalette = createQueryHook<ChartPaletteResponse>(
  'chart-palette',
  (client, opts) =>
    client('/api/chart/palette', ChartPaletteResponseSchema, opts),
  'chart palette',
);
