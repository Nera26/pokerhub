import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrecacheController } from '../src/routes/precache.controller';
import { ConfigService } from '../src/services/config.service';

describe('PrecacheController', () => {
  let app: INestApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it('returns asset urls from ConfigService', async () => {
    const mockConfig: Partial<ConfigService> = {
      getPrecacheUrls: jest.fn().mockResolvedValue(['/app.js', '/styles.css']),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PrecacheController],
      providers: [{ provide: ConfigService, useValue: mockConfig }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/precache')
      .expect(200)
      .expect(['/app.js', '/styles.css']);

    expect(mockConfig.getPrecacheUrls).toHaveBeenCalled();
  });

  it('returns empty array when ConfigService provides none', async () => {
    const mockConfig: Partial<ConfigService> = {
      getPrecacheUrls: jest.fn().mockResolvedValue([]),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PrecacheController],
      providers: [{ provide: ConfigService, useValue: mockConfig }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get('/precache').expect(200).expect([]);

    expect(mockConfig.getPrecacheUrls).toHaveBeenCalled();
  });
});

