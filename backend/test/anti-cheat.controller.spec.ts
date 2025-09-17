import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AntiCheatController } from '../src/routes/anti-cheat.controller';
import { CollusionService } from '../src/analytics/collusion.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

const collusion = {
  listFlaggedSessions: jest.fn(),
  getActionHistory: jest.fn(),
  applyAction: jest.fn(),
} as unknown as jest.Mocked<Partial<CollusionService>>;

describe('AntiCheatController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AntiCheatController],
      providers: [{ provide: CollusionService, useValue: collusion }],
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns flagged sessions with history', async () => {
    (collusion.listFlaggedSessions as jest.Mock).mockResolvedValue([
      { id: 's1', users: ['PlayerOne'], status: 'flagged' },
    ]);
    (collusion.getActionHistory as jest.Mock).mockResolvedValue([
      { action: 'warn', reviewerId: 'admin', timestamp: 100 },
    ]);

    await request(app.getHttpServer())
      .get('/anti-cheat/flags')
      .expect(200)
      .expect([
        {
          id: 's1',
          users: ['PlayerOne'],
          status: 'flagged',
          history: [{ action: 'warn', reviewerId: 'admin', timestamp: 100 }],
        },
      ]);
  });

  it('escalates a flag and returns updated record', async () => {
    (collusion.applyAction as jest.Mock).mockResolvedValue(undefined);
    (collusion.getActionHistory as jest.Mock).mockResolvedValue([
      { action: 'warn', reviewerId: 'alice', timestamp: 100 },
      { action: 'restrict', reviewerId: 'bob', timestamp: 200 },
    ]);
    (collusion.listFlaggedSessions as jest.Mock).mockResolvedValue([
      { id: 's1', users: ['PlayerOne'], status: 'restrict' },
    ]);

    await request(app.getHttpServer())
      .put('/anti-cheat/flags/s1')
      .send({ action: 'restrict' })
      .expect(200)
      .expect({
        id: 's1',
        users: ['PlayerOne'],
        status: 'restrict',
        history: [
          { action: 'warn', reviewerId: 'alice', timestamp: 100 },
          { action: 'restrict', reviewerId: 'bob', timestamp: 200 },
        ],
      });

    expect(collusion.applyAction).toHaveBeenCalledWith('s1', 'restrict', 'admin');
    expect(collusion.getActionHistory).toHaveBeenCalledWith('s1');
    expect(collusion.listFlaggedSessions).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      status: 'restrict',
    });
  });

  it('maps service errors to http responses', async () => {
    (collusion.applyAction as jest.Mock).mockRejectedValue(
      new Error('Invalid review action'),
    );

    await request(app.getHttpServer())
      .put('/anti-cheat/flags/missing')
      .send({ action: 'ban' })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            statusCode: 400,
            message: 'Invalid review action',
          }),
        );
      });

    (collusion.applyAction as jest.Mock).mockRejectedValue(
      new Error('Session not found'),
    );

    await request(app.getHttpServer())
      .put('/anti-cheat/flags/missing')
      .send({ action: 'warn' })
      .expect(404);
  });

  it('computes the next action sequence', async () => {
    await request(app.getHttpServer())
      .get('/anti-cheat/next-action')
      .query({ current: 'flagged' })
      .expect(200)
      .expect({ next: 'warn' });

    await request(app.getHttpServer())
      .get('/anti-cheat/next-action')
      .query({ current: 'ban' })
      .expect(200)
      .expect({ next: null });
  });
});
