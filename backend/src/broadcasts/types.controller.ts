import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BroadcastTypesResponseSchema } from '../schemas/broadcasts';

const types = {
  announcement: {
    icon: '📢',
    color: 'text-accent-yellow',
  },
  alert: {
    icon: '⚠️',
    color: 'text-danger-red',
  },
  notice: {
    icon: 'ℹ️',
    color: 'text-accent-blue',
  },
};

@ApiTags('broadcast')
@Controller('broadcasts')
export class BroadcastTypesController {
  @Get('types')
  @ApiOperation({ summary: 'Get broadcast types' })
  @ApiResponse({ status: 200, description: 'Broadcast types' })
  types() {
    return BroadcastTypesResponseSchema.parse({ types });
  }
}

