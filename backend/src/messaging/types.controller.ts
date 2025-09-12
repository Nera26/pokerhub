import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BroadcastTypesResponseSchema } from '../schemas/broadcasts';
import { BroadcastsService } from './broadcasts.service';

@ApiTags('broadcast')
@Controller('broadcasts')
export class BroadcastTypesController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Get('types')
  @ApiOperation({ summary: 'Get broadcast types' })
  @ApiResponse({ status: 200, description: 'Broadcast types' })
  async types() {
    const types = await this.broadcasts.listTypes();
    return BroadcastTypesResponseSchema.parse({ types });
  }
}

