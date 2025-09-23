process.env.DATABASE_URL = '';

import { Module, ConflictException, NotFoundException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { PromotionsService } from '../src/promotions/promotions.service';
import { PromotionEntity } from '../src/database/entities/promotion.entity';
import { PromotionClaimEntity } from '../src/database/entities/promotion-claim.entity';

function createTestModule() {
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
          db.public.registerFunction({
            name: 'current_database',
            returns: 'text',
            implementation: () => 'test',
          });

          dataSource = db.adapters.createTypeormDataSource({
            type: 'postgres',
            entities: [PromotionEntity, PromotionClaimEntity],
            synchronize: true,
          }) as DataSource;

          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource.initialize(),
      }),
      TypeOrmModule.forFeature([PromotionEntity, PromotionClaimEntity]),
    ],
    providers: [PromotionsService],
    exports: [PromotionsService],
  })
  class PromotionsTestModule {}

  return { PromotionsTestModule, getDataSource: () => dataSource };
}

describe('PromotionsService', () => {
  let service: PromotionsService;
  let dataSource: DataSource;
  let app: INestApplication;

  beforeAll(async () => {
    const { PromotionsTestModule, getDataSource } = createTestModule();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [PromotionsTestModule],
    }).compile();

    service = moduleRef.get(PromotionsService);
    dataSource = getDataSource();

    app = moduleRef.createNestApplication();
    await app.init();

    const repo = dataSource.getRepository(PromotionEntity);
    await repo.insert({
      id: 'promo-1',
      category: 'daily',
      title: 'Daily Grinder',
      description: 'Play 10 hands to earn rewards',
      reward: '$5 bonus',
      breakdown: [],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.getRepository(PromotionClaimEntity).clear();
  });

  it('claims a promotion and returns confirmation', async () => {
    await expect(service.claim('promo-1', 'user-1')).resolves.toEqual({
      message: 'Promotion "Daily Grinder" claimed',
    });

    const stored = await dataSource.getRepository(PromotionClaimEntity).findOne({
      where: { promotionId: 'promo-1', userId: 'user-1' },
    });

    expect(stored).toBeTruthy();
  });

  it('prevents claiming the same promotion twice', async () => {
    await service.claim('promo-1', 'user-1');
    await expect(service.claim('promo-1', 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('throws when promotion does not exist', async () => {
    await expect(service.claim('missing', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
