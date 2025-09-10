/** @jest-environment node */

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';

import { BroadcastsModule } from '../src/broadcasts/broadcasts.module';
import { BroadcastEntity } from '../src/database/entities/broadcast.entity';
import { BroadcastTemplateEntity } from '../src/database/entities/broadcast-template.entity';
import { BroadcastTypeEntity } from '../src/database/entities/broadcast-type.entity';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('BroadcastsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    let dataSource: DataSource;

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

            // deterministic-ish UUID generator for pg-mem
            let seq = 1;
            db.public.registerFunction({
              name: 'uuid_generate_v4',
              returns: 'text',
              implementation: () => {
                const id = seq.toString(16).padStart(32, '0');
                seq++;
                return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(
                  12,
                  16,
                )}-${id.slice(16, 20)}-${id.slice(20)}`;
              },
            });

            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [
                BroadcastEntity,
                BroadcastTemplateEntity,
                BroadcastTypeEntity,
              ],
              synchronize: true,
            }) as DataSource;

            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        BroadcastsModule,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Seed broadcast types
    const typeRepo = dataSource.getRepository(BroadcastTypeEntity);
    await typeRepo.save([
      { name: 'announcement', icon: '📢', color: 'text-accent-yellow' },
      { name: 'alert', icon: '⚠️', color: 'text-danger-red' },
      { name: 'notice', icon: 'ℹ️', color: 'text-accent-blue' },
    ]);

    // Seed broadcast templates
    const templateRepo = dataSource.getRepository(BroadcastTemplateEntity);
    await templateRepo.save({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'maintenance',
      text:
        'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
    });
    await templateRepo.save({
      id: '22222222-2222-2222-2222-222222222222',
      name: 'tournament',
      text:
        'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists broadcasts', async () => {
    await request(app.getHttpServer())
      .get('/admin/broadcasts')
      .set('Authorization', 'Bearer test')
      .expect(200)
      .expect({ broadcasts: [] });
  });

  it('sends broadcast and persists', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/broadcasts')
      .set('Authorization', 'Bearer test')
      .send({ type: 'announcement', text: 'Hello', urgent: false, sound: true })
      .expect(201);

    expect(res.body).toMatchObject({
      type: 'announcement',
      text: 'Hello',
      urgent: false,
    });

    const list = await request(app.getHttpServer())
      .get('/admin/broadcasts')
      .set('Authorization', 'Bearer test')
      .expect(200);

    expect(list.body.broadcasts).toHaveLength(1);
    expect(list.body.broadcasts[0].text).toBe('Hello');
  });

  it('returns broadcast templates', async () => {
    await request(app.getHttpServer())
      .get('/broadcast/templates')
      .expect(200)
      .expect({
        templates: {
          maintenance:
            'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
          tournament:
            'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!',
        },
      });
  });

  it('returns broadcast types', async () => {
    await request(app.getHttpServer())
      .get('/broadcasts/types')
      .expect(200)
      .expect({
        types: {
          announcement: { icon: '📢', color: 'text-accent-yellow' },
          alert: { icon: '⚠️', color: 'text-danger-red' },
          notice: { icon: 'ℹ️', color: 'text-accent-blue' },
        },
      });
  });
});
