import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { SiteMetadataController } from '../src/routes/site-metadata.controller';
import type { SiteMetadataResponse } from '@shared/types';

describe('SiteMetadataController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.SITE_TITLE = 'My Title';
    process.env.SITE_DESCRIPTION = 'My Desc';
    process.env.SITE_IMAGE_PATH = '/logo.png';

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SiteMetadataController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns site metadata', async () => {
    const res = await request(app.getHttpServer())
      .get('/site-metadata')
      .expect(200);
    const body: SiteMetadataResponse = res.body;
    expect(body).toEqual({
      title: 'My Title',
      description: 'My Desc',
      imagePath: '/logo.png',
    });
  });
});
