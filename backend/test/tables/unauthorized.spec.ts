import { Test } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { TablesController } from '../../src/routes/tables.controller';
import { TablesService } from '../../src/game/tables.service';
import { ChatService } from '../../src/game/chat.service';
import { AuthGuard } from '../../src/auth/auth.guard';
import { AdminGuard } from '../../src/auth/admin.guard';

describe('TablesController auth', () => {
  let app: INestApplication;
  const id = '00000000-0000-0000-0000-000000000000';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TablesController],
      providers: [
        { provide: TablesService, useValue: {} },
        { provide: ChatService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          const header = req.headers['authorization'];
          if (typeof header === 'string' && header.startsWith('Bearer ')) {
            req.userId = header.slice(7);
            return true;
          }
          return false;
        },
      })
      .overrideGuard(AdminGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          return req.headers['authorization'] === 'Bearer admin';
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated create', async () => {
    await request(app.getHttpServer()).post('/tables').send({}).expect(401);
  });

  it('rejects unauthenticated update', async () => {
    await request(app.getHttpServer())
      .put(`/tables/${id}`)
      .send({})
      .expect(401);
  });

  it('rejects unauthenticated delete', async () => {
    await request(app.getHttpServer())
      .delete(`/tables/${id}`)
      .expect(401);
  });

  it('rejects non-admin create', async () => {
    await request(app.getHttpServer())
      .post('/tables')
      .set('Authorization', 'Bearer user')
      .send({})
      .expect(403);
  });

  it('rejects non-admin update', async () => {
    await request(app.getHttpServer())
      .put(`/tables/${id}`)
      .set('Authorization', 'Bearer user')
      .send({})
      .expect(403);
  });

  it('rejects non-admin delete', async () => {
    await request(app.getHttpServer())
      .delete(`/tables/${id}`)
      .set('Authorization', 'Bearer user')
      .expect(403);
  });
});
