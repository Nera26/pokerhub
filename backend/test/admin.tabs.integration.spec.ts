process.env.DATABASE_URL = '';

import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { AdminController } from '../src/routes/admin.controller';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { KycService } from '../src/wallet/kyc.service';
import { RevenueService } from '../src/wallet/revenue.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { AdminTabEntity } from '../src/database/entities/admin-tab.entity';
import { AdminTabsService } from '../src/services/admin-tabs.service';
import { WalletService } from '../src/wallet/wallet.service';
import {
  CANONICAL_ADMIN_SIDEBAR_TABS,
  type AdminSidebarTabSeed,
} from '../src/database/seeds/admin-sidebar-tabs';

type AdminTabSeed = Pick<
  AdminTabEntity,
  'id' | 'label' | 'icon' | 'component' | 'source'
>;

const SEED_TABS: AdminTabSeed[] = [
  ...CANONICAL_ADMIN_SIDEBAR_TABS.map((tab: AdminSidebarTabSeed) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    component: tab.component,
    source: tab.source ?? 'config',
  })),
  {
    id: 'runtime',
    label: 'Runtime Tools',
    icon: 'faBolt',
    component: '@/app/components/dashboard/RuntimeTools',
    source: 'database',
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

  it('returns tabs persisted in the database with their sources', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/tabs')
      .expect(200);

    const expected = SEED_TABS.map((tab) => ({
      id: tab.id,
      title: tab.label,
      component: tab.component,
      icon: tab.icon,
      source: tab.source,
    })).sort((a, b) => a.id.localeCompare(b.id));

    const sortedResponse = [...response.body].sort((a, b) =>
      a.id.localeCompare(b.id),
    );

    expect(sortedResponse).toEqual(expected);
    const runtimeTab = sortedResponse.find(
      (tab: { id: string }) => tab.id === 'runtime',
    );
    expect(runtimeTab).toMatchObject({ source: 'database' });
    const configTabs = sortedResponse.filter(
      (tab: { source?: string }) => tab.source === 'config',
    );
    expect(configTabs.length).toBeGreaterThan(0);
  });
});
