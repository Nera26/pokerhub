import { Injectable } from '@nestjs/common';

const DEFAULT_PALETTE = ['#ff4d4f', '#facc15', '#3b82f6', '#22c55e'];

@Injectable()
export class SettingsService {
  async getChartPalette(): Promise<string[]> {
    const env = process.env.CHART_PALETTE;
    if (env) {
      return env
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    }
    return DEFAULT_PALETTE;
  }
}
