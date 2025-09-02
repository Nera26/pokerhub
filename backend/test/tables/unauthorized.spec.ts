import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TablesController } from '../../src/routes/tables.controller';
import { TablesService } from '../../src/game/tables.service';
import { ChatService } from '../../src/game/chat.service';
import { AuthGuard } from '../../src/auth/auth.guard';
import { SessionService } from '../../src/session/session.service';

describe('TablesController auth', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TablesController],
      providers: [
        { provide: TablesService, useValue: {} },
        { provide: ChatService, useValue: {} },
        AuthGuard,
        { provide: SessionService, useValue: { verifyAccessToken: jest.fn() } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated create', async () => {
    await request(app.getHttpServer()).post('/tables').send({}).expect(401);
  });
});
