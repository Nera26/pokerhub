process.env.DATABASE_URL = '';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import request from 'supertest';

import { ConfigController } from '../src/routes/config.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { ChipDenomsService } from '../src/services/chip-denoms.service';
import { TableThemeService } from '../src/services/table-theme.service';
import { DefaultAvatarService } from '../src/services/default-avatar.service';
import { ChipDenominationEntity } from '../src/database/entities/chip-denomination.entity';
import { TableThemeEntity } from '../src/database/entities/table-theme.entity';
import { DefaultAvatarEntity } from '../src/database/entities/default-avatar.entity';

import type { ChipDenominationsResponse, TableThemeResponse } from '@shared/types';

const defaultChips: ChipDenominationsResponse = { denoms: [1000, 100, 25] };
const mockTheme: TableThemeResponse = {
  hairline: 'var(--color-hairline)',
  positions: {
    BTN: {
      color: 'hsl(44,88%,60%)',
      glow: 'hsla(44,88%,60%,0.45)',
      badge: '/badges/btn.svg',
    },
    SB: {
      color: 'hsl(202,90%,60%)',
      glow: 'hsla(202,90%,60%,0.45)',
      badge: '/badges/sb.svg',
    },
    BB: {
      color: 'hsl(275,85%,65%)',
      glow: 'hsla(275,85%,65%,0.45)',
      badge: '/badges/bb.svg',
    },
    UTG: { color: 'var(--color-pos-utg)', glow: 'var(--glow-pos-utg)' },
    MP: { color: 'var(--color-pos-mp)', glow: 'var(--glow-pos-mp)' },
    CO: { color: 'var(--color-pos-co)', glow: 'var(--glow-pos-co)' },
    HJ: { color: 'var(--color-pos-hj)', glow: 'var(--glow-pos-hj)' },
    LJ: { color: 'var(--color-pos-lj)', glow: 'var(--glow-pos-lj)' },
  },
};

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
            entities: [
              ChipDenominationEntity,
              TableThemeEntity,
              DefaultAvatarEntity,
            ],
            synchronize: true,
          }) as DataSource;

          return dataSource.options;
        },
        dataSourceFactory: async () => dataSource.initialize(),
      }),
      TypeOrmModule.forFeature([
        ChipDenominationEntity,
        TableThemeEntity,
        DefaultAvatarEntity,
      ]),
    ],
    controllers: [ConfigController],
    providers: [ChipDenomsService, TableThemeService, DefaultAvatarService],
  })
  class ConfigTestModule {}

  return { module: ConfigTestModule };
}

describe('ConfigController', () => {
  let app: INestApplication;
  let chipService: ChipDenomsService;
  let avatarService: DefaultAvatarService;

  beforeAll(async () => {
    const { module: ConfigTestModule } = createTestModule();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigTestModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    chipService = moduleRef.get(ChipDenomsService);
    avatarService = moduleRef.get(DefaultAvatarService);

    await chipService.update(defaultChips.denoms);
    await request(app.getHttpServer())
      .put('/config/table-theme')
      .send(mockTheme)
      .expect(200);
    await avatarService.update('initial.png');
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns chip denominations', async () => {
    const res = await request(app.getHttpServer())
      .get('/config/chips')
      .expect(200);

    expect(res.body).toEqual(defaultChips);
  });

  it('updates chip denominations', async () => {
    await request(app.getHttpServer())
      .put('/config/chips')
      .send({ denoms: [500, 100, 25] })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/config/chips')
      .expect(200);

    expect(res.body).toEqual({ denoms: [500, 100, 25] });
  });

  it('returns table theme', async () => {
    const res = await request(app.getHttpServer())
      .get('/config/table-theme')
      .expect(200);

    expect(res.body).toEqual(mockTheme);
  });

  it('updates table theme', async () => {
    const updated = { ...mockTheme, hairline: 'blue' };
    await request(app.getHttpServer())
      .put('/config/table-theme')
      .send(updated)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/config/table-theme')
      .expect(200);

    expect(res.body).toEqual(updated);
  });

  it('returns default avatar', async () => {
    const res = await request(app.getHttpServer())
      .get('/config/default-avatar')
      .expect(200);
    expect(res.body).toEqual({ defaultAvatar: 'initial.png' });
  });

  it('updates default avatar', async () => {
    await request(app.getHttpServer())
      .put('/config/default-avatar')
      .send({ defaultAvatar: 'updated.png' })
      .expect(200);
    const res = await request(app.getHttpServer())
      .get('/config/default-avatar')
      .expect(200);
    expect(res.body).toEqual({ defaultAvatar: 'updated.png' });
  });
});
