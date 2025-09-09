import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminController } from '../src/routes/admin.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { KycService } from '../src/wallet/kyc.service';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { SidebarService } from '../src/services/sidebar.service';
import type { SidebarItem } from '../src/schemas/admin';

describe('AdminController', () => {
  let app: INestApplication;

  const kyc = { getDenialReason: jest.fn() } as Partial<KycService>;
  const analytics = {
    getAuditLogs: jest.fn(),
    getSecurityAlerts: jest.fn(),
    getAdminEvents: jest.fn(),
  } as Partial<AnalyticsService>;
  const sidebarItems: SidebarItem[] = [
    { id: 'dynamic', label: 'Dynamic', icon: 'chart-line' },
  ];
  const sidebar = {
    getItems: jest.fn().mockResolvedValue(sidebarItems),
  } as Partial<SidebarService>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: KycService, useValue: kyc },
        { provide: AnalyticsService, useValue: analytics },
        { provide: SidebarService, useValue: sidebar },
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

  it('returns audit logs', async () => {
    (analytics.getAuditLogs as jest.Mock).mockResolvedValue({
      logs: [],
      nextCursor: null,
    });
    await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .expect(200)
      .expect({ logs: [], nextCursor: null });
  });

  it('returns security alerts', async () => {
    (analytics.getSecurityAlerts as jest.Mock).mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/admin/security-alerts')
      .expect(200)
      .expect([]);
  });

  it('returns admin events', async () => {
    (analytics.getAdminEvents as jest.Mock).mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/admin/events')
      .expect(200)
      .expect([]);
  });

  it('returns sidebar items from service', async () => {
    await request(app.getHttpServer())
      .get('/admin/sidebar')
      .expect(200)
      .expect(sidebarItems);
  });

  it('returns tabs and titles from service', async () => {
    const tabs = sidebarItems.map((s) => s.id);
    const titles = Object.fromEntries(sidebarItems.map((s) => [s.id, s.label]));
    await request(app.getHttpServer())
      .get('/admin/tabs')
      .expect(200)
      .expect({ tabs, titles });
  });
});
