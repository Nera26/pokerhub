import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrecacheController } from '../src/routes/precache.controller';
import { GcsService } from '../src/storage/gcs.service';

describe('PrecacheController', () => {
  let app: INestApplication | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it('returns manifest urls from storage', async () => {
    const mockStorage: Partial<GcsService> = {
      downloadObject: jest
        .fn()
        .mockResolvedValue(
          Buffer.from(JSON.stringify(['/app.js', '/styles.css'])),
        ),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PrecacheController],
      providers: [{ provide: GcsService, useValue: mockStorage }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/precache-manifest')
      .expect(200)
      .expect(['/app.js', '/styles.css']);

    expect(mockStorage.downloadObject).toHaveBeenCalledWith(
      'precache-manifest.json',
    );
  });

  it('returns empty array when manifest empty', async () => {
    const mockStorage: Partial<GcsService> = {
      downloadObject: jest.fn().mockResolvedValue(Buffer.from('[]')),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PrecacheController],
      providers: [{ provide: GcsService, useValue: mockStorage }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/precache-manifest')
      .expect(200)
      .expect([]);

    expect(mockStorage.downloadObject).toHaveBeenCalledWith(
      'precache-manifest.json',
    );
  });

  it('returns 500 when storage fails', async () => {
    const mockStorage: Partial<GcsService> = {
      downloadObject: jest.fn().mockRejectedValue(new Error('fail')),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PrecacheController],
      providers: [{ provide: GcsService, useValue: mockStorage }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get('/precache-manifest').expect(500);

    expect(mockStorage.downloadObject).toHaveBeenCalledWith(
      'precache-manifest.json',
    );
  });
});

