import type { Repository } from 'typeorm';
import { PerformanceThresholdsService } from '../src/services/performance-thresholds.service';
import { PerformanceThresholdEntity } from '../src/database/entities/performance-threshold.entity';

describe('PerformanceThresholdsService', () => {
  let rows: PerformanceThresholdEntity[];
  let repo: Partial<Repository<PerformanceThresholdEntity>>;
  let service: PerformanceThresholdsService;

  beforeEach(() => {
    process.env.PERF_THRESHOLD_INP = '175';
    process.env.PERF_THRESHOLD_LCP = '3200';
    process.env.PERF_THRESHOLD_CLS = '0.12';

    rows = [];
    repo = {
      find: jest.fn(async () => rows),
      save: jest.fn(async (input: PerformanceThresholdEntity[] | PerformanceThresholdEntity) => {
        const list = Array.isArray(input) ? input : [input];
        for (const entity of list) {
          const index = rows.findIndex((row) => row.metric === entity.metric);
          if (index === -1) {
            rows.push({ ...entity });
          } else {
            rows[index] = { ...rows[index], value: entity.value };
          }
        }
        return list as PerformanceThresholdEntity[];
      }),
      create: jest.fn((data) => ({ ...data })) as Repository<PerformanceThresholdEntity>['create'],
    };

    service = new PerformanceThresholdsService(
      repo as Repository<PerformanceThresholdEntity>,
    );
  });

  afterEach(() => {
    delete process.env.PERF_THRESHOLD_INP;
    delete process.env.PERF_THRESHOLD_LCP;
    delete process.env.PERF_THRESHOLD_CLS;
  });

  it('bootstraps thresholds from environment when storage is empty', async () => {
    const result = await service.get();

    expect(result).toEqual({ INP: 175, LCP: 3200, CLS: 0.12 });
    expect(repo.save).toHaveBeenCalledWith([
      { metric: 'INP', value: 175 },
      { metric: 'LCP', value: 3200 },
      { metric: 'CLS', value: 0.12 },
    ]);
  });

  it('returns persisted thresholds when available', async () => {
    rows = [
      { metric: 'INP', value: 120 },
      { metric: 'LCP', value: 2100 },
      { metric: 'CLS', value: 0.08 },
    ];

    const result = await service.get();

    expect(result).toEqual({ INP: 120, LCP: 2100, CLS: 0.08 });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('fills missing metrics with defaults and persists them', async () => {
    rows = [{ metric: 'INP', value: 180 }];

    const result = await service.get();

    expect(result).toEqual({ INP: 180, LCP: 3200, CLS: 0.12 });
    expect(repo.save).toHaveBeenCalledWith([
      { metric: 'LCP', value: 3200 },
      { metric: 'CLS', value: 0.12 },
    ]);
  });

  it('updates thresholds and returns the saved values', async () => {
    const updated = await service.update({
      INP: 130,
      LCP: 2400,
      CLS: 0.09,
    });

    expect(repo.save).toHaveBeenCalledWith([
      { metric: 'INP', value: 130 },
      { metric: 'LCP', value: 2400 },
      { metric: 'CLS', value: 0.09 },
    ]);
    expect(updated).toEqual({ INP: 130, LCP: 2400, CLS: 0.09 });

    const roundTrip = await service.get();
    expect(roundTrip).toEqual(updated);
  });

  it('ignores invalid stored values and restores defaults', async () => {
    rows = [
      { metric: 'INP', value: Number.NaN },
      { metric: 'LCP', value: 2500 },
      { metric: 'CLS', value: 0.05 },
    ];

    const result = await service.get();

    expect(result).toEqual({ INP: 175, LCP: 2500, CLS: 0.05 });
    expect(repo.save).toHaveBeenCalledWith([{ metric: 'INP', value: 175 }]);
  });
});
