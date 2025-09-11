import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  SiteMetadataResponse,
  SiteMetadataResponseSchema,
} from '../schemas/site-metadata';

const DEFAULT_TITLE = 'PokerHub';
const DEFAULT_DESCRIPTION = "Live Texas Hold'em, Omaha & Tournaments — PokerHub";
const DEFAULT_IMAGE = '/pokerhub-logo.svg';

@ApiTags('site')
@Controller('site-metadata')
export class SiteMetadataController {
  @Get()
  @ApiOperation({ summary: 'Get site metadata' })
  @ApiResponse({ status: 200, description: 'Site metadata' })
  async get(): Promise<SiteMetadataResponse> {
    const data = {
      title: process.env.SITE_TITLE ?? DEFAULT_TITLE,
      description: process.env.SITE_DESCRIPTION ?? DEFAULT_DESCRIPTION,
      imagePath: process.env.SITE_IMAGE_PATH ?? DEFAULT_IMAGE,
    };
    return SiteMetadataResponseSchema.parse(data);
  }
}
