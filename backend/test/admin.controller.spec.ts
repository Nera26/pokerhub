import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminController } from '../src/routes/admin.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { KycService } from '../src/wallet/kyc.service';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { AdminSidebarRepository } from '../src/routes/admin-sidebar.repository';

describe('AdminController', () => {
  let app: INestApplication;
  const kyc = { getDenialReason: jest.fn() } as Partial<KycService>;
  const analytics = {
    getAuditLogs: jest.fn(),
    getSecurityAlerts: jest.fn(),
  } as Partial<AnalyticsService>;
  const sidebarRepo = { findAll: jest.fn() } as Partial<AdminSidebarRepository>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: KycService, useValue: kyc },
        { provide: AnalyticsService, useValue: analytics },
        { provide: AdminSidebarRepository, useValue: sidebarRepo },
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

  it('returns sidebar items', async () => {
    (sidebarRepo.findAll as jest.Mock).mockResolvedValue([
      { id: 'dashboard', label: 'Dashboard', icon: 'chart-line' },
    ]);
    await request(app.getHttpServer())
      .get('/admin/sidebar')
      .expect(200)
      .expect([{ id: 'dashboard', label: 'Dashboard', icon: 'chart-line' }]);
  });

  it('returns empty sidebar when no items', async () => {
    (sidebarRepo.findAll as jest.Mock).mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/admin/sidebar')
      .expect(200)
      .expect([]);
  });
});
