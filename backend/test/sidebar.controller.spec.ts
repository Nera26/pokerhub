import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SidebarController } from '../src/routes/sidebar.controller';
import { SidebarService } from '../src/routes/sidebar.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('SidebarController', () => {
  let app: INestApplication;
  const service = { list: jest.fn() } as Partial<SidebarService>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SidebarController],
      providers: [{ provide: SidebarService, useValue: service }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns sidebar items from service', async () => {
    (service.list as jest.Mock).mockResolvedValueOnce([
      { id: 'dash', label: 'Dash', icon: 'chart-line' },
    ]);
    await request(app.getHttpServer())
      .get('/sidebar')
      .expect(200)
      .expect([{ id: 'dash', label: 'Dash', icon: 'chart-line' }]);
  });
});
