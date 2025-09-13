import { Injectable } from '@nestjs/common';

const DEFAULTS = {
  INP: 150,
  LCP: 2500,
  CLS: 0.05,
} as const;

@Injectable()
export class PerformanceThresholdsService {
  async get(): Promise<typeof DEFAULTS> {
    return {
      INP: Number(process.env.PERF_THRESHOLD_INP ?? DEFAULTS.INP),
      LCP: Number(process.env.PERF_THRESHOLD_LCP ?? DEFAULTS.LCP),
      CLS: Number(process.env.PERF_THRESHOLD_CLS ?? DEFAULTS.CLS),
    };
  }
}
