import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TiersSchema, type Tier } from '../schemas/tiers';

@ApiTags('tiers')
@Controller('tiers')
export class TiersController {
  @Get()
  @ApiOperation({ summary: 'Get tier definitions' })
  @ApiResponse({ status: 200, description: 'Tier definitions' })
  getTiers(): Tier[] {
    return TiersSchema.parse([
      { name: 'Bronze', min: 0, max: 999 },
      { name: 'Silver', min: 1000, max: 4999 },
      { name: 'Gold', min: 5000, max: 9999 },
      { name: 'Diamond', min: 10000, max: 19999 },
      { name: 'Platinum', min: 20000, max: null },
    ]);
  }
}
