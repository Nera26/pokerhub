import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('PrecacheController', () => {
  let app: INestApplication | null = null;

  async function bootstrap(): Promise<INestApplication> {
    // Import AFTER env & mocks are set (module computes on load)
    const { PrecacheController } = require('../src/routes/precache.controller');
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PrecacheController],
    }).compile();

    const nestApp = moduleRef.createNestApplication();
    await nestApp.init();
    return nestApp;
  }

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
    // Clean up env and module/mocks between tests
    delete process.env.PRECACHE_URLS;
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock('fs');
  });

  it('returns asset urls from env when PRECACHE_URLS is set', async () => {
    jest.resetModules();
    process.env.PRECACHE_URLS = '/,/favicon.ico';

    // (Optional) ensure fs isn’t consulted by providing a harmless mock
    jest.doMock('fs', () => ({
      readFileSync: jest.fn(() => {
        throw new Error('should not read manifest when env is set');
      }),
    }));

    app = await bootstrap();

    await request(app.getHttpServer())
      .get('/precache')
      .expect(200)
      .expect(['/', '/favicon.ico']);
  });

  it('returns asset urls from manifest when env is not set', async () => {
    jest.resetModules();
    delete process.env.PRECACHE_URLS;

    // Mock manifest contents as an array of URLs
    jest.doMock('fs', () => ({
      readFileSync: jest.fn(() => JSON.stringify(['/app.js', '/styles.css'])),
    }));

    app = await bootstrap();

    await request(app.getHttpServer())
      .get('/precache')
      .expect(200)
      .expect(['/app.js', '/styles.css']);
  });
});
