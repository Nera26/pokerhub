import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type Tiers } from '../schemas/tiers';
import { TierService } from '../tiers/tier.service';

@ApiTags('tiers')
@Controller('tiers')
export class TiersController {
  constructor(private readonly service: TierService) {}

  @Get()
  @ApiOperation({ summary: 'Get tier definitions' })
  @ApiResponse({ status: 200, description: 'Tier definitions' })
  async getTiers(): Promise<Tiers> {
    return await this.service.list();
  }
}
