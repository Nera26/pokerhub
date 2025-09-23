import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConflictException, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { PromotionsController } from '../src/routes/promotions.controller';
import { PromotionsService } from '../src/promotions/promotions.service';
import type { Promotion } from '@shared/types';
import { AuthGuard } from '../src/auth/auth.guard';

describe('PromotionsController', () => {
  let app: INestApplication;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    claim: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [{ provide: PromotionsService, useValue: service }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          req.userId = 'user-1';
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    service.claim.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns empty promotion list', async () => {
    service.findAll.mockResolvedValue([]);
    const res = await request(app.getHttpServer()).get('/promotions').expect(200);
    expect(res.body).toEqual([]);
  });

  it('returns promotion data', async () => {
    const promotion: Promotion = {
      id: '1',
      category: 'daily',
      title: 'Cash Game Challenge',
      description: 'Play to earn rewards',
      reward: '$50 Bonus',
      breakdown: [{ label: 'hands', value: 10 }],
    };
    service.findAll.mockResolvedValue([promotion]);
    service.findOne.mockResolvedValue(promotion);

    const list = await request(app.getHttpServer()).get('/promotions').expect(200);
    expect(list.body).toEqual([promotion]);

    const single = await request(app.getHttpServer()).get('/promotions/1').expect(200);
    expect(single.body).toEqual(promotion);
  });

  it('returns 404 when promotion not found', async () => {
    service.findOne.mockResolvedValue(null);
    await request(app.getHttpServer()).get('/promotions/404').expect(404);
  });

  it('claims a promotion successfully', async () => {
    service.claim.mockResolvedValue({ message: 'Promotion claimed' });

    const res = await request(app.getHttpServer())
      .post('/promotions/1/claim')
      .expect(200);

    expect(service.claim).toHaveBeenCalledWith('1', 'user-1');
    expect(res.body).toEqual({ message: 'Promotion claimed' });
  });

  it('prevents double claim attempts', async () => {
    service.claim.mockRejectedValue(new ConflictException('Promotion already claimed'));

    await request(app.getHttpServer())
      .post('/promotions/1/claim')
      .expect(409);
  });

  it('returns 404 when claiming missing promotion', async () => {
    service.claim.mockRejectedValue(new NotFoundException('Promotion not found'));

    await request(app.getHttpServer())
      .post('/promotions/404/claim')
      .expect(404);
  });
});

