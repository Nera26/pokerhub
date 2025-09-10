import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BroadcastTemplatesResponseSchema } from '../schemas/broadcasts';
import { BroadcastsService } from './broadcasts.service';

@ApiTags('broadcast')
@Controller('broadcast')
export class BroadcastTemplatesController {
  constructor(private readonly service: BroadcastsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get broadcast templates' })
  @ApiResponse({ status: 200, description: 'Broadcast templates' })
  async templates() {
    const templates = await this.service.listTemplates();
    return BroadcastTemplatesResponseSchema.parse({ templates });
  }
}
