process.env.DATABASE_URL = '';

import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { AdminController } from '../src/routes/admin.controller';
import { SidebarService } from '../src/services/sidebar.service';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { KycService } from '../src/wallet/kyc.service';
import { RevenueService } from '../src/wallet/revenue.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { AdminTabEntity } from '../src/database/entities/admin-tab.entity';
import { AdminTabsService } from '../src/services/admin-tabs.service';
import { WalletService } from '../src/wallet/wallet.service';

type AdminTabSeed = Pick<AdminTabEntity, 'id' | 'label' | 'icon' | 'component'>;

const SEED_TABS: AdminTabSeed[] = [
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
    id: 'deposits-reconcile',
    label: 'Bank Reconciliation',
    icon: 'faFileInvoiceDollar',
    component: '@/app/components/dashboard/AdminBankReconciliation',
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
    id: 'tables',
    label: 'Tables',
    icon: 'faTable',
    component: '@/app/components/dashboard/ManageTables',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: 'faMoneyBillWave',
    component: '@/app/components/dashboard/transactions/TransactionHistory',
  },
  {
    id: 'tournaments',
    label: 'Tournaments',
    icon: 'faTrophy',
    component: '@/app/components/dashboard/ManageTournaments',
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'faUsers',
    component: '@/app/components/dashboard/ManageUsers',
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
];

describe('Admin tabs integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => {
            const db = newDb();
            db.public.registerFunction({
              name: 'version',
              returns: 'text',
              implementation: () => 'pg-mem',
            });
            db.public.registerFunction({
              name: 'current_database',
              returns: 'text',
              implementation: () => 'test',
            });
            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [AdminTabEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([AdminTabEntity]),
      ],
      controllers: [AdminController],
      providers: [
        SidebarService,
        AdminTabsService,
        { provide: AnalyticsService, useValue: {} },
        { provide: KycService, useValue: {} },
        { provide: RevenueService, useValue: {} },
        { provide: WalletService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const repo = dataSource.getRepository(AdminTabEntity);
    await repo.insert(SEED_TABS);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns database-backed tabs only', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/tabs')
      .expect(200);

    const expected = SEED_TABS.map((tab) => ({
      id: tab.id,
      title: tab.label,
      component: tab.component,
      icon: tab.icon,
      source: 'database',
    })).sort((a, b) => a.id.localeCompare(b.id));

    expect(response.body).toEqual(expected);
    expect(
      response.body.every(
        (tab: { source?: string }) => tab.source === 'database',
      ),
    ).toBe(true);
  });

  it('supports CRUD operations for admin tabs', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/admin/tabs')
      .send({
        id: 'reports',
        title: 'Reports',
        icon: 'chart-bar',
        component: 'reports-component',
      })
      .expect(200);
    expect(createResponse.body).toEqual({
      id: 'reports',
      title: 'Reports',
      icon: 'faChartBar',
      component: 'reports-component',
      source: 'database',
    });

    const updateResponse = await request(app.getHttpServer())
      .put('/admin/tabs/reports')
      .send({
        title: 'Updated Reports',
        icon: 'faChartLine',
        component: 'reports-component',
      })
      .expect(200);
    expect(updateResponse.body).toEqual({
      id: 'reports',
      title: 'Updated Reports',
      icon: 'faChartLine',
      component: 'reports-component',
      source: 'database',
    });

    const listResponse = await request(app.getHttpServer())
      .get('/admin/tabs')
      .expect(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'reports', title: 'Updated Reports' }),
      ]),
    );

    await request(app.getHttpServer())
      .delete('/admin/tabs/reports')
      .expect(204);

    const finalList = await request(app.getHttpServer())
      .get('/admin/tabs')
      .expect(200);
    expect(finalList.body).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ id: 'reports' }),
      ]),
    );
  });
});
