import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminController } from '../src/routes/admin.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { KycService } from '../src/wallet/kyc.service';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { SidebarService } from '../src/services/sidebar.service';
import type { SidebarItem } from '../src/schemas/admin';
import { RevenueService } from '../src/wallet/revenue.service';
import { AdminTabsService } from '../src/services/admin-tabs.service';
import { WalletService } from '../src/wallet/wallet.service';
import type { ReconcileRow } from '../src/wallet/wallet.service';
import type { WalletReconcileMismatchAcknowledgement } from '@shared/wallet.schema';

describe('AdminController', () => {
  let app: INestApplication;

  const kyc = { getDenialReason: jest.fn() } as Partial<KycService>;
  const analytics = {
    getAuditLogs: jest.fn(),
    getSecurityAlerts: jest.fn(),
    getAdminEvents: jest.fn(),
    getAuditLogTypes: jest.fn(),
    getAuditLogTypeClasses: jest.fn(),
    markAuditLogReviewed: jest.fn(),
    acknowledgeSecurityAlert: jest.fn(),
    acknowledgeAdminEvent: jest.fn(),
  } as Partial<AnalyticsService>;
  const revenue = {
    getBreakdown: jest.fn(),
  } as Partial<RevenueService>;
  const sidebarItems: SidebarItem[] = [
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'faChartLine',
      component: '@/app/components/dashboard/analytics/Analytics',
    },
    {
      id: 'broadcast',
      label: 'Broadcasts',
      icon: 'faBullhorn',
      component: '@/app/components/dashboard/BroadcastPanel',
    },
    {
      id: 'events',
      label: 'Events',
      icon: 'faBell',
      component: '@/app/components/dashboard/AdminEvents',
    },
    {
      id: 'feature-flags',
      label: 'Feature Flags',
      icon: 'faToggleOn',
      component: '@/app/components/dashboard/FeatureFlagsPanel',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: 'faMoneyBillWave',
      component: '@/app/components/dashboard/transactions/TransactionHistory',
    },
    {
      id: 'wallet-iban',
      label: 'IBAN Manager',
      icon: 'faBuildingColumns',
      component: '@/app/components/dashboard/IbanManager',
    },
    {
      id: 'wallet-reconcile',
      label: 'Wallet Reconcile',
      icon: 'faCoins',
      component: '@/app/components/dashboard/WalletReconcileMismatches',
    },
    {
      id: 'wallet-withdrawals',
      label: 'Withdrawals',
      icon: 'faMoneyCheck',
      component: '@/app/components/dashboard/Withdrawals',
    },
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
    {
      id: 'dynamic',
      label: 'Dynamic',
      icon: 'faChartLine',
      component: 'dynamic-component',
    },
  ];
  const sidebar = {
    getItems: jest.fn(),
  } as Partial<SidebarService>;
  const adminTabs = {
    list: jest.fn(),
    find: jest.fn(),
  } as Partial<AdminTabsService>;
  const wallet = {} as Partial<WalletService>;
  let acknowledged: Map<string, WalletReconcileMismatchAcknowledgement>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: KycService, useValue: kyc },
        { provide: AnalyticsService, useValue: analytics },
        { provide: SidebarService, useValue: sidebar },
        { provide: AdminTabsService, useValue: adminTabs },
        { provide: RevenueService, useValue: revenue },
        { provide: WalletService, useValue: wallet },
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

  beforeEach(() => {
    acknowledged = new Map();
    (sidebar.getItems as jest.Mock).mockResolvedValue(sidebarItems);
    (adminTabs.list as jest.Mock).mockResolvedValue(
      sidebarItems.map((item) => ({
        id: item.id,
        title: item.label,
        component: item.component,
        icon: item.icon,
      })),
    );
    (adminTabs.find as jest.Mock).mockResolvedValue(null);
    wallet.reconcile = jest.fn();
    wallet.acknowledgeMismatch = jest
      .fn()
      .mockImplementation(
        async (account: string, adminId: string) => {
          const ack: WalletReconcileMismatchAcknowledgement = {
            account,
            acknowledgedBy: adminId,
            acknowledgedAt: new Date().toISOString(),
          };
          acknowledged.set(account, ack);
          return ack;
        },
      );
    wallet.filterAcknowledgedMismatches = jest
      .fn()
      .mockImplementation((rows: ReconcileRow[]) =>
        rows.filter((row) => acknowledged.has(row.account) === false),
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns audit logs with query params', async () => {
    (analytics.getAuditLogs as jest.Mock).mockResolvedValue({
      logs: [],
      total: 0,
    });
    await request(app.getHttpServer())
      .get('/admin/audit-logs')
      .query({ search: 'foo', page: 2 })
      .expect(200)
      .expect({ logs: [], total: 0 });
    expect(analytics.getAuditLogs).toHaveBeenCalledWith({
      search: 'foo',
      page: 2,
      limit: 50,
    });
  });

  it('returns audit log types', async () => {
    (analytics.getAuditLogTypes as jest.Mock).mockResolvedValue(['Login']);
    await request(app.getHttpServer())
      .get('/admin/audit/log-types')
      .expect(200)
      .expect({ types: ['Login'] });
  });

  it('returns audit log type classes', async () => {
    (analytics.getAuditLogTypeClasses as jest.Mock).mockResolvedValue({
      Login: 'bg-accent-green/20 text-accent-green',
    });
    await request(app.getHttpServer())
      .get('/admin/log-types')
      .expect(200)
      .expect({ Login: 'bg-accent-green/20 text-accent-green' });
  });

  it('marks audit log as reviewed', async () => {
    const log = {
      id: 'log-1',
      timestamp: '2024-01-01T00:00:00Z',
      type: 'Login',
      description: 'User logged in',
      user: 'alice',
      ip: '127.0.0.1',
      reviewed: true,
      reviewedBy: 'admin',
      reviewedAt: '2024-01-02T00:00:00Z',
    };
    (analytics.markAuditLogReviewed as jest.Mock).mockResolvedValue(log);
    await request(app.getHttpServer())
      .post('/admin/audit-logs/log-1/review')
      .expect(200)
      .expect(log);
    expect(analytics.markAuditLogReviewed).toHaveBeenCalledWith('log-1', 'admin');
  });

  it('returns empty audit log types', async () => {
    (analytics.getAuditLogTypes as jest.Mock).mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/admin/audit/log-types')
      .expect(200)
      .expect({ types: [] });
  });

  it('returns security alerts', async () => {
    (analytics.getSecurityAlerts as jest.Mock).mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/admin/security-alerts')
      .expect(200)
      .expect([]);
  });

  it('acknowledges a security alert', async () => {
    const alert = {
      id: 'alert-1',
      severity: 'danger',
      title: 'Alert',
      body: 'Body',
      time: 'now',
      resolved: true,
    };
    (analytics.acknowledgeSecurityAlert as jest.Mock).mockResolvedValue(alert);
    await request(app.getHttpServer())
      .post('/admin/security-alerts/alert-1/ack')
      .expect(200)
      .expect(alert);
    expect(analytics.acknowledgeSecurityAlert).toHaveBeenCalledWith('alert-1');
  });

  it('returns admin events', async () => {
    (analytics.getAdminEvents as jest.Mock).mockResolvedValue([]);
    await request(app.getHttpServer())
      .get('/admin/events')
      .expect(200)
      .expect([]);
  });

  it('acknowledges an admin event', async () => {
    (analytics.acknowledgeAdminEvent as jest.Mock).mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .post('/admin/events/event-1/ack')
      .expect(200)
      .expect({ message: 'acknowledged' });
    expect(analytics.acknowledgeAdminEvent).toHaveBeenCalledWith('event-1');
  });

  it('returns 404 when admin event is missing', async () => {
    (analytics.acknowledgeAdminEvent as jest.Mock).mockRejectedValue(
      new NotFoundException('Admin event not found'),
    );

    await request(app.getHttpServer())
      .post('/admin/events/missing/ack')
      .expect(404);
  });

  it('returns sidebar items from service', async () => {
    await request(app.getHttpServer())
      .get('/admin/sidebar')
      .expect(200)
      .expect(sidebarItems);
  });

  it('returns tabs with components from service', async () => {
    const tabs = sidebarItems.map((s) => ({
      id: s.id,
      title: s.label,
      component: s.component,
      icon: s.icon,
      source: 'database',
    }));
    const response = await request(app.getHttpServer())
      .get('/admin/tabs')
      .expect(200);
    expect(response.body).toEqual(tabs);
    expect(response.body).toContainEqual({
      id: 'wallet-reconcile',
      title: 'Wallet Reconcile',
      component: '@/app/components/dashboard/WalletReconcileMismatches',
      icon: 'faCoins',
      source: 'database',
    });
    expect(response.body).toContainEqual({
      id: 'wallet-withdrawals',
      title: 'Withdrawals',
      component: '@/app/components/dashboard/Withdrawals',
      icon: 'faMoneyCheck',
      source: 'database',
    });
  });

  it('returns metadata for config-defined tabs', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/tabs/feature-flags')
      .expect(200);

    expect(response.body).toEqual({
      id: 'feature-flags',
      title: 'Feature Flags',
      component: '@/app/components/dashboard/FeatureFlagsPanel',
      enabled: true,
      message: '',
    });
  });

  it('returns metadata using database override when present', async () => {
    (adminTabs.find as jest.Mock).mockResolvedValue({
      id: 'dynamic',
      title: 'Dynamic Override',
      component: 'db-component',
      icon: 'faBolt',
    });

    const response = await request(app.getHttpServer())
      .get('/admin/tabs/dynamic')
      .expect(200);

    expect(response.body).toEqual({
      id: 'dynamic',
      title: 'Dynamic Override',
      component: 'db-component',
      enabled: true,
      message: '',
    });
  });

  it('returns disabled metadata with fallback message when tab is missing', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/tabs/unknown-tab')
      .expect(200);

    expect(response.body).toEqual({
      id: 'unknown-tab',
      title: 'Unknown Tab',
      component: '',
      enabled: false,
      message: 'This section is coming soon.',
    });
  });

  it('returns revenue breakdown', async () => {
    (revenue.getBreakdown as jest.Mock).mockResolvedValue({
      currency: 'GBP',
      streams: [{ label: 'Cash', pct: 100, value: 200 }],
    });
    await request(app.getHttpServer())
      .get('/admin/revenue-breakdown?range=all')
      .expect(200)
      .expect({
        currency: 'GBP',
        streams: [{ label: 'Cash', pct: 100, value: 200 }],
      });
  });

  it('returns wallet reconcile mismatches with computed delta', async () => {
    const now = new Date('2024-01-01T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);
    (wallet.reconcile as jest.Mock).mockResolvedValue([
      { account: 'player:1', balance: 1500, journal: 1200 },
    ]);

    const { body } = await request(app.getHttpServer())
      .get('/admin/wallet/reconcile/mismatches')
      .expect(200);

    expect(wallet.reconcile).toHaveBeenCalledTimes(1);
    expect(wallet.filterAcknowledgedMismatches).toHaveBeenCalledWith([
      { account: 'player:1', balance: 1500, journal: 1200 },
    ]);
    expect(body).toEqual({
      mismatches: [
        {
          account: 'player:1',
          balance: 1500,
          journal: 1200,
          delta: 300,
          date: now.toISOString(),
        },
      ],
    });
  });

  it('acknowledges wallet mismatches and filters them from subsequent responses', async () => {
    const now = new Date('2024-02-01T00:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);
    (wallet.reconcile as jest.Mock).mockResolvedValue([
      { account: 'player:1', balance: 1500, journal: 1200 },
    ]);

    const initial = await request(app.getHttpServer())
      .get('/admin/wallet/reconcile/mismatches')
      .expect(200);
    expect(initial.body.mismatches).toHaveLength(1);

    const ackResponse = await request(app.getHttpServer())
      .post('/admin/wallet/reconcile/mismatches/player:1/ack')
      .expect(200);

    expect(wallet.acknowledgeMismatch).toHaveBeenCalledWith('player:1', 'admin');
    expect(ackResponse.body).toEqual({
      account: 'player:1',
      acknowledgedBy: 'admin',
      acknowledgedAt: now.toISOString(),
    });

    const afterAck = await request(app.getHttpServer())
      .get('/admin/wallet/reconcile/mismatches')
      .expect(200);

    expect(wallet.filterAcknowledgedMismatches).toHaveBeenLastCalledWith([
      { account: 'player:1', balance: 1500, journal: 1200 },
    ]);
    expect(afterAck.body).toEqual({ mismatches: [] });
  });
});
