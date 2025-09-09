import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminBonusController } from '../src/routes/admin-bonus.controller';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('AdminBonusController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminBonusController],
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

  it('returns bonus options', async () => {
    await request(app.getHttpServer())
      .get('/admin/bonus/options')
      .expect(200)
      .expect({
        types: [
          { value: 'deposit', label: 'Deposit Match' },
          { value: 'rakeback', label: 'Rakeback' },
          { value: 'ticket', label: 'Tournament Tickets' },
          { value: 'rebate', label: 'Rebate' },
          { value: 'first-deposit', label: 'First Deposit Only' },
        ],
        eligibilities: [
          { value: 'all', label: 'All Players' },
          { value: 'new', label: 'New Players Only' },
          { value: 'vip', label: 'VIP Players Only' },
          { value: 'active', label: 'Active Players' },
        ],
        statuses: [
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'Paused' },
        ],
      });
  });
});
