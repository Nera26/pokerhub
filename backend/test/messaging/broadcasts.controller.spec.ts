/** @jest-environment node */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { setupBroadcasts, BroadcastsTestContext } from './broadcasts.test-utils';

describe('BroadcastsController', () => {
  let app: INestApplication;
  let ctx: BroadcastsTestContext;

  beforeAll(async () => {
    ctx = await setupBroadcasts();
    app = ctx.app;
  });

  afterAll(async () => {
    await app.close();
    await ctx.repos.dataSource.destroy();
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

  it('returns broadcast types', async () => {
    await request(app.getHttpServer())
      .get('/broadcasts/types')
      .expect(200)
      .expect({
        types: {
          announcement: { icon: '📢', color: 'text-accent-yellow' },
          alert: { icon: '⚠️', color: 'text-danger-red' },
          notice: { icon: 'ℹ️', color: 'text-accent-blue' },
        },
      });
  });
});
