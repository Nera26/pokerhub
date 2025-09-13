process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';
import { TablesController } from '../../src/routes/tables.controller';
import { TablesService } from '../../src/game/tables.service';
import { Table } from '../../src/database/entities/table.entity';
import { ChatService } from '../../src/game/chat.service';
import { RoomManager } from '../../src/game/room.service';
import { User } from '../../src/database/entities/user.entity';

let dataSource: DataSource;

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const db = newDb();
        db.public.registerFunction({
          name: 'version',
          returns: 'text',
          implementation: () => 'pg-mem',
        });
        dataSource = db.adapters.createTypeormDataSource({
          type: 'postgres',
          entities: [Table],
          synchronize: true,
        }) as DataSource;
        return dataSource.options;
      },
      dataSourceFactory: async () => dataSource.initialize(),
    }),
    TypeOrmModule.forFeature([Table]),
  ],
  controllers: [TablesController],
  providers: [
    TablesService,
    { provide: ChatService, useValue: {} },
    { provide: RoomManager, useValue: {} },
    { provide: getRepositoryToken(User), useValue: {} },
  ],
})
class TabsTestModule {}

describe('GET /tables/:id/tabs', () => {
  let app: INestApplication;
  let tableId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TabsTestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    dataSource = moduleRef.get(DataSource);
    const repo = dataSource.getRepository(Table);
    const saved = await repo.save({
      name: 'Tabs Table',
      gameType: 'texas',
      smallBlind: 1,
      bigBlind: 2,
      startingStack: 100,
      playersMax: 6,
      minBuyIn: 40,
      maxBuyIn: 200,
      tabs: ['chat'],
    });
    tableId = saved.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns stored tabs for table', async () => {
    await request(app.getHttpServer())
      .get(`/tables/${tableId}/tabs`)
      .expect(200)
      .expect(['chat']);
  });
});
