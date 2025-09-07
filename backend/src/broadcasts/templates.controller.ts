import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BroadcastTemplatesResponseSchema } from '../schemas/broadcasts';

const templates = {
  maintenance:
    'Server maintenance scheduled for [DATE] at [TIME]. Expected downtime: [DURATION]. We apologize for any inconvenience.',
  tournament:
    'New tournament starting [DATE] at [TIME]! Buy-in: [AMOUNT] | Prize Pool: [PRIZE] | Register now to secure your seat!',
};

@ApiTags('broadcast')
@Controller('broadcast')
export class BroadcastTemplatesController {
  @Get('templates')
  @ApiOperation({ summary: 'Get broadcast templates' })
  @ApiResponse({ status: 200, description: 'Broadcast templates' })
  templates() {
    return BroadcastTemplatesResponseSchema.parse({ templates });
  }
}
