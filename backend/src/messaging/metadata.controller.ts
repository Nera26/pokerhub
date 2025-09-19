import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BroadcastTemplatesResponseSchema,
  BroadcastTypesResponseSchema,
} from '../schemas/broadcasts';
import { BroadcastsService } from './broadcasts.service';

@ApiTags('broadcast')
@Controller()
export class BroadcastMetadataController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Get('broadcast/templates')
  @ApiOperation({ summary: 'Get broadcast templates' })
  @ApiResponse({ status: 200, description: 'Broadcast templates' })
  async templates() {
    const templates = await this.broadcasts.listTemplates();
    return BroadcastTemplatesResponseSchema.parse({ templates });
  }

  @Get('broadcasts/types')
  @ApiOperation({ summary: 'Get broadcast types' })
  @ApiResponse({ status: 200, description: 'Broadcast types' })
  async types() {
    const types = await this.broadcasts.listTypes();
    return BroadcastTypesResponseSchema.parse({ types });
  }
}
