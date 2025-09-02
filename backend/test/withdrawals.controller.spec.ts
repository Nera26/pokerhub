import { Test } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { WithdrawalsController } from '../src/withdrawals/withdrawals.controller';
import { WithdrawalsService } from '../src/withdrawals/withdrawals.service';
import { AdminGuard } from '../src/auth/admin.guard';

class MockAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.userId = 'admin';
    return true;
  }
}

describe('WithdrawalsController', () => {
  let app: INestApplication;
  const service = { approve: jest.fn(), reject: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WithdrawalsController],
      providers: [{ provide: WithdrawalsService, useValue: service }],
    })
      .overrideGuard(AdminGuard)
      .useClass(MockAdminGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('approves withdrawal', async () => {
    service.approve.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .post('/withdrawals/u1/approve')
      .send({ comment: 'ok' })
      .expect(200)
      .expect({ message: 'approved' });
    expect(service.approve).toHaveBeenCalledWith('u1', 'admin', 'ok');
  });

  it('rejects withdrawal', async () => {
    service.reject.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .post('/withdrawals/u1/reject')
      .send({ comment: 'no' })
      .expect(200)
      .expect({ message: 'rejected' });
    expect(service.reject).toHaveBeenCalledWith('u1', 'admin', 'no');
  });
});

