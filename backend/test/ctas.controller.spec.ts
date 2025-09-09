import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CtasController } from '../src/routes/ctas.controller';
import { CTARepository } from '../src/ctas/cta.repository';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';
import type { CTA } from '../src/schemas/ctas';

class FakeCTARepository {
  private ctas: CTA[] = [];

  async find(): Promise<CTA[]> {
    return this.ctas;
  }

  async save(cta: CTA): Promise<CTA> {
    const idx = this.ctas.findIndex((c) => c.id === cta.id);
    if (idx >= 0) {
      this.ctas[idx] = cta;
    } else {
      this.ctas.push(cta);
    }
    return cta;
  }
}

describe('CtasController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CtasController],
      providers: [{ provide: CTARepository, useClass: FakeCTARepository }],
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

  it('creates and lists CTAs', async () => {
    await request(app.getHttpServer()).get('/ctas').expect(200, []);

    await request(app.getHttpServer())
      .post('/ctas')
      .send({
        id: 'join-table',
        label: 'Join a Live Table',
        href: '#cash-games-panel',
        variant: 'primary',
      })
      .expect(200);

    const res = await request(app.getHttpServer()).get('/ctas').expect(200);
    expect(res.body).toEqual([
      {
        id: 'join-table',
        label: 'Join a Live Table',
        href: '#cash-games-panel',
        variant: 'primary',
      },
    ]);
  });
});

