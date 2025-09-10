import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { BroadcastsService } from '../src/broadcasts/broadcasts.service';
import { BroadcastEntity } from '../src/database/entities/broadcast.entity';
import { BroadcastTemplateEntity } from '../src/database/entities/broadcast-template.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('BroadcastsService', () => {
  let service: BroadcastsService;
  let moduleRef: any;

  beforeAll(async () => {
    let dataSource: DataSource;
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
            let seq = 1;
            db.public.registerFunction({
              name: 'uuid_generate_v4',
              returns: 'text',
              implementation: () => {
                const id = seq.toString(16).padStart(32, '0');
                seq++;
                return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
              },
            });
            dataSource = db.adapters.createTypeormDataSource({
              type: 'postgres',
              entities: [BroadcastEntity, BroadcastTemplateEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([BroadcastEntity, BroadcastTemplateEntity]),
      ],
      providers: [BroadcastsService],
    }).compile();

    service = moduleRef.get(BroadcastsService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('persists broadcasts', async () => {
    await service.send({ type: 'announcement', text: 'Hello', urgent: false, sound: true });
    const list = await service.list();
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe('Hello');
  });

  it('lists templates from database', async () => {
    const repo = moduleRef.get(getRepositoryToken(BroadcastTemplateEntity));
    await repo.save({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'maintenance',
      text:
        'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
    });
    await repo.save({
      id: '22222222-2222-2222-2222-222222222222',
      name: 'tournament',
      text:
        'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!',
    });
    const templates = await service.listTemplates();
    expect(templates).toEqual({
      maintenance:
        'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
      tournament:
        'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!',
    });
  });
});
