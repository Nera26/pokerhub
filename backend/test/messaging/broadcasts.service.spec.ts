import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';

import { BroadcastsService } from '../../src/messaging/broadcasts.service';
import { BroadcastEntity } from '../../src/database/entities/broadcast.entity';
import { BroadcastTemplateEntity } from '../../src/database/entities/broadcast-template.entity';
import { BroadcastTypeEntity } from '../../src/database/entities/broadcast-type.entity';

describe('BroadcastsService', () => {
  let service: BroadcastsService;
  let moduleRef: any;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
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

            // Deterministic UUID generator for pg-mem
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
        TypeOrmModule.forFeature([
          BroadcastEntity,
          BroadcastTemplateEntity,
          BroadcastTypeEntity,
        ]),
      ],
      providers: [BroadcastsService],
    }).compile();

    service = moduleRef.get(BroadcastsService);
    dataSource = moduleRef.get(DataSource);

    // Seed types
    const typeRepo = dataSource.getRepository(BroadcastTypeEntity);
    await typeRepo.save({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'announcement',
      icon: '📢',
      color: 'text-accent-yellow',
    });
    await typeRepo.save({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'alert',
      icon: '⚠️',
      color: 'text-danger-red',
    });
    await typeRepo.save({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'notice',
      icon: 'ℹ️',
      color: 'text-accent-blue',
    });

    // Seed templates
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
    await moduleRef.close();
  });

  it('persists broadcasts', async () => {
    await service.send({
      type: 'announcement',
      text: 'Hello',
      urgent: false,
      sound: true,
    });
    const list = await service.list();
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe('Hello');
  });

  it('lists types', async () => {
    const types = await service.listTypes();
    expect(types).toEqual({
      announcement: { icon: '📢', color: 'text-accent-yellow' },
      alert: { icon: '⚠️', color: 'text-danger-red' },
      notice: { icon: 'ℹ️', color: 'text-accent-blue' },
    });
  });

  it('lists templates from database', async () => {
    const templates = await service.listTemplates();
    expect(templates).toEqual({
      maintenance:
        'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
      tournament:
        'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!',
    });
  });
});
