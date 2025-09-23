import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PerformanceThresholdEntity,
  type PerformanceThresholdMetric,
} from '../database/entities/performance-threshold.entity';

const DEFAULTS: Record<PerformanceThresholdMetric, number> = {
  INP: 150,
  LCP: 2500,
  CLS: 0.05,
};

type Thresholds = Record<PerformanceThresholdMetric, number>;

@Injectable()
export class PerformanceThresholdsService {
  constructor(
    @InjectRepository(PerformanceThresholdEntity)
    private readonly repo: Repository<PerformanceThresholdEntity>,
  ) {}

  private readEnv(metric: PerformanceThresholdMetric): number {
    const envKey = `PERF_THRESHOLD_${metric}` as const;
    const raw = process.env[envKey];
    if (raw === undefined || raw.trim() === '') {
      return DEFAULTS[metric];
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : DEFAULTS[metric];
  }

  private bootstrapValues(): Thresholds {
    return {
      INP: this.readEnv('INP'),
      LCP: this.readEnv('LCP'),
      CLS: this.readEnv('CLS'),
    };
  }

  async get(): Promise<Thresholds> {
    const defaults = this.bootstrapValues();
    const rows = await this.repo.find();
    const result: Thresholds = { ...defaults };
    const missing: PerformanceThresholdMetric[] = [];

    for (const metric of Object.keys(defaults) as PerformanceThresholdMetric[]) {
      const row = rows.find((entry) => entry.metric === metric);
      if (!row) {
        missing.push(metric);
        continue;
      }
      const value = Number(row.value);
      if (Number.isFinite(value)) {
        result[metric] = value;
      } else {
        missing.push(metric);
      }
    }

    if (missing.length) {
      await this.repo.save(
        missing.map((metric) =>
          this.repo.create({ metric, value: result[metric] }),
        ),
      );
    }

    return result;
  }

  async update(values: Thresholds): Promise<Thresholds> {
    const entries = (Object.entries(values) as [
      PerformanceThresholdMetric,
      number,
    ][]).map(([metric, value]) => this.repo.create({ metric, value }));

    if (entries.length) {
      await this.repo.save(entries);
    }

    return this.get();
  }
}
