import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SettingsController } from '../src/routes/settings.controller';
import { SettingsService } from '../src/services/settings.service';

describe('SettingsController', () => {
  let app: INestApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it('returns chart palette', async () => {
    const mock: Partial<SettingsService> = {
      getChartPalette: jest.fn().mockResolvedValue(['#111', '#222']),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: SettingsService, useValue: mock }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/settings/chart-palette')
      .expect(200)
      .expect(['#111', '#222']);

    expect(mock.getChartPalette).toHaveBeenCalled();
  });
});
