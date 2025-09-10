import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrecacheListResponse, PrecacheListResponseSchema } from '../schemas/precache';

const PRECACHE_URLS = process.env.PRECACHE_URLS
  ? process.env.PRECACHE_URLS.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

@ApiTags('precache')
@Controller('precache')
export class PrecacheController {
  @Get()
  @ApiOperation({ summary: 'List asset URLs to pre-cache' })
  @ApiResponse({ status: 200, description: 'Asset URLs', type: [String] })
  list(): PrecacheListResponse {
    return PrecacheListResponseSchema.parse(PRECACHE_URLS);
  }
}
