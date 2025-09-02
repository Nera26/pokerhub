import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ServiceStatusResponse } from '@shared/types';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is up', schema: { type: 'string' } })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get service status' })
  @ApiResponse({ status: 200, description: 'Current service status' })
  getStatus(): ServiceStatusResponse {
    return this.appService.getStatus();
  }
}
