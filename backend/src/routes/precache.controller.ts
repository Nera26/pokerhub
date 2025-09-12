import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GcsService } from '../storage/gcs.service';
import {
  PrecacheListResponse,
  PrecacheListResponseSchema,
} from '../schemas/precache';

@ApiTags('precache')
@Controller('precache-manifest')
export class PrecacheController {
  constructor(private readonly storage: GcsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve pre-cache manifest' })
  @ApiResponse({ status: 200, description: 'Asset URLs', type: [String] })
  async list(): Promise<PrecacheListResponse> {
    const buf = await this.storage.downloadObject('precache-manifest.json');
    const data = JSON.parse(buf.toString('utf-8'));
    return PrecacheListResponseSchema.parse(data);
  }
}

