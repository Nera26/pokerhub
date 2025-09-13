import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminController } from '../src/routes/admin.controller';
import { SidebarService } from '../src/services/sidebar.service';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { KycService } from '../src/wallet/kyc.service';
import { RevenueService } from '../src/wallet/revenue.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import type { SidebarItem } from '../src/schemas/admin';

describe('Admin tabs integration', () => {
  let app: INestApplication;

  const sidebarSeed: SidebarItem[] = [
    {
      id: 'users',
      label: 'Users',
      icon: 'faUsers',
      component: '@/app/components/dashboard/ManageUsers',
    },
    {
      id: 'tables',
      label: 'Tables',
      icon: 'faTable',
      component: '@/app/components/dashboard/ManageTables',
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      icon: 'faTrophy',
      component: '@/app/components/dashboard/ManageTournaments',
    },
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        SidebarService,
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'admin.sidebar' ? sidebarSeed : undefined) } },
        { provide: AnalyticsService, useValue: {} },
        { provide: KycService, useValue: {} },
        { provide: RevenueService, useValue: {} },
      ],
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

  it('returns pre-seeded tabs', async () => {
    const tabs = sidebarSeed.map((s) => ({
      id: s.id,
      title: s.label,
      component: s.component,
    }));
    await request(app.getHttpServer())
      .get('/admin/tabs')
      .expect(200)
      .expect(tabs);
  });
});
