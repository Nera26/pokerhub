import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigController } from '../src/routes/config.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import { ChipDenomsService } from '../src/services/chip-denoms.service';
import { TableThemeService } from '../src/services/table-theme.service';
import type {
  ChipDenominationsResponse,
  TableThemeResponse,
} from '@shared/types';

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

describe('ConfigController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [ChipDenomsService, TableThemeService],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
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
    const themeService = app.get(TableThemeService);
    const customTheme = { ...mockTheme, hairline: '#123' };
    themeService.update(customTheme);
    const res = await request(app.getHttpServer())
      .get('/config/table-theme')
      .expect(200);
    expect(res.body).toEqual(customTheme);
  });
});
