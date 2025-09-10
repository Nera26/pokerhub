import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { BroadcastsService } from '../src/broadcasts/broadcasts.service';
import { BroadcastEntity } from '../src/database/entities/broadcast.entity';
import { BroadcastTypeEntity } from '../src/database/entities/broadcast-type.entity';

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
              entities: [BroadcastEntity, BroadcastTypeEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([BroadcastEntity, BroadcastTypeEntity]),
      ],
      providers: [BroadcastsService],
    }).compile();

    service = moduleRef.get(BroadcastsService);

    const typeRepo = dataSource.getRepository(BroadcastTypeEntity);
    await typeRepo.save([
      { name: 'announcement', icon: '📢', color: 'text-accent-yellow' },
      { name: 'alert', icon: '⚠️', color: 'text-danger-red' },
      { name: 'notice', icon: 'ℹ️', color: 'text-accent-blue' },
    ]);
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

  it('lists types', async () => {
    const types = await service.listTypes();
    expect(types).toEqual({
      announcement: { icon: '📢', color: 'text-accent-yellow' },
      alert: { icon: '⚠️', color: 'text-danger-red' },
      notice: { icon: 'ℹ️', color: 'text-accent-blue' },
    });
  });
});
