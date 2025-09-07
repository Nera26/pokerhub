import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BroadcastsModule } from '../src/broadcasts/broadcasts.module';
import { AuthGuard } from '../src/auth/auth.guard';
import { AdminGuard } from '../src/auth/admin.guard';

describe('BroadcastsController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BroadcastsModule],
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

  it('lists broadcasts', async () => {
    await request(app.getHttpServer())
      .get('/admin/broadcasts')
      .set('Authorization', 'Bearer test')
      .expect(200)
      .expect({ broadcasts: [] });
  });

  it('sends broadcast and persists', async () => {
    const res = await request(app.getHttpServer())
      .post('/admin/broadcasts')
      .set('Authorization', 'Bearer test')
      .send({ type: 'announcement', text: 'Hello', urgent: false, sound: true })
      .expect(201);

    expect(res.body).toMatchObject({
      type: 'announcement',
      text: 'Hello',
      urgent: false,
    });

    const list = await request(app.getHttpServer())
      .get('/admin/broadcasts')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(list.body.broadcasts).toHaveLength(1);
    expect(list.body.broadcasts[0].text).toBe('Hello');
  });

  it('returns broadcast templates', async () => {
    await request(app.getHttpServer())
      .get('/broadcast/templates')
      .expect(200)
      .expect({
        templates: {
          maintenance:
            'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
          tournament:
            'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!',
        },
      });
  });
});
