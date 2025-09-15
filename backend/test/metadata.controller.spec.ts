import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MetadataController } from '../src/routes/metadata.controller';
import type { SiteMetadataResponse } from '@shared/types';
import { DefaultAvatarService } from '../src/services/default-avatar.service';
import { ConfigService } from '@nestjs/config';

describe('MetadataController', () => {
  let app: INestApplication;
  const defaultAvatar = 'https://example.com/avatar.png';
  const config: Record<string, string> = {
    'site.title': 'My Title',
    'site.description': 'My Desc',
    'site.imagePath': '/logo.png',
  };
  const configService = {
    get: jest.fn((key: string) => config[key]),
  } as unknown as ConfigService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MetadataController],
      providers: [
        {
          provide: DefaultAvatarService,
          useValue: { get: jest.fn().mockResolvedValue(defaultAvatar) },
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
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
      defaultAvatar,
    });
    expect(configService.get).toHaveBeenCalledWith('site.title', expect.anything());
    expect(configService.get).toHaveBeenCalledWith('site.description', expect.anything());
    expect(configService.get).toHaveBeenCalledWith('site.imagePath', expect.anything());
  });
});
