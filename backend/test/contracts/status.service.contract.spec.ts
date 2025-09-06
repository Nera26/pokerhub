import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import { API_CONTRACT_VERSION } from '@shared/constants';
import { ServiceStatusResponseSchema } from '@shared/types';

describe('Contract: frontend service /status', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: 'API_CONTRACT_VERSION', useValue: API_CONTRACT_VERSION },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('matches shared schema', async () => {
    const res = await fetch(`${baseUrl}/status`);
    const json = await res.json();
    const parsed = ServiceStatusResponseSchema.parse(json);
    expect(parsed).toEqual({
      status: 'ok',
      contractVersion: API_CONTRACT_VERSION,
    });
  });
});
