import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ServiceStatusResponse } from '@shared/types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  getStatus(): ServiceStatusResponse {
    return this.appService.getStatus();
  }
}
