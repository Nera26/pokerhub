import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return greeting', () => {
    expect(appController.getHello()).toBe('PokerHub backend is running');
  });

  it('should return health', () => {
    expect(appController.getHealth()).toEqual({ status: 'ok' });
  });
});
