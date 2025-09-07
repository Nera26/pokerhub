import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { BroadcastsService } from '../src/broadcasts/broadcasts.service';
import { BroadcastEntity } from '../src/database/entities/broadcast.entity';

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
              entities: [BroadcastEntity],
              synchronize: true,
            }) as DataSource;
            return dataSource.options;
          },
          dataSourceFactory: async () => dataSource.initialize(),
        }),
        TypeOrmModule.forFeature([BroadcastEntity]),
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
});
