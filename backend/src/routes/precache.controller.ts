import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '../services/config.service';
import {
  PrecacheListResponse,
  PrecacheListResponseSchema,
} from '../schemas/precache';

@ApiTags('precache')
@Controller('precache')
export class PrecacheController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List asset URLs to pre-cache' })
  @ApiResponse({ status: 200, description: 'Asset URLs', type: [String] })
  async list(): Promise<PrecacheListResponse> {
    const urls = await this.config.getPrecacheUrls();
    return PrecacheListResponseSchema.parse(urls);
  }
}

