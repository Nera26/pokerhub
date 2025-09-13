process.env.DATABASE_URL = '';

import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { AdminController } from '../src/routes/admin.controller';
import { SidebarService } from '../src/services/sidebar.service';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from '../src/analytics/analytics.service';
import { KycService } from '../src/wallet/kyc.service';
import { RevenueService } from '../src/wallet/revenue.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { AdminTabEntity } from '../src/database/entities/admin-tab.entity';

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
        { provide: ConfigService, useValue: { get: () => undefined } },
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

    const repo = dataSource.getRepository(AdminTabEntity);
    await repo.insert([
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
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns pre-seeded tabs', async () => {
    const tabs = [
      {
        id: 'users',
        title: 'Users',
        component: '@/app/components/dashboard/ManageUsers',
      },
      {
        id: 'tables',
        title: 'Tables',
        component: '@/app/components/dashboard/ManageTables',
      },
      {
        id: 'tournaments',
        title: 'Tournaments',
        component: '@/app/components/dashboard/ManageTournaments',
      },
    ];
    await request(app.getHttpServer())
      .get('/admin/tabs')
      .expect(200)
      .expect(tabs);
  });
});
