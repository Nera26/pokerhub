import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  SiteMetadataResponseSchema,
  type SiteMetadataResponse,
} from '@shared/types';
import { DefaultAvatarService } from '../services/default-avatar.service';

@ApiTags('site')
@Controller('site-metadata')
export class MetadataController {
  constructor(
    private readonly avatars: DefaultAvatarService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get site metadata' })
  @ApiResponse({ status: 200, description: 'Site metadata' })
  async get(): Promise<SiteMetadataResponse> {
    const data = {
      title: this.config.get<string>('site.title', 'PokerHub'),
      description: this.config.get<string>(
        'site.description',
        "Live Texas Hold'em, Omaha & Tournaments — PokerHub",
      ),
      imagePath: this.config.get<string>('site.imagePath', '/pokerhub-logo.svg'),
      defaultAvatar:
        (await this.avatars.get()) ||
        'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
    };
    return SiteMetadataResponseSchema.parse(data);
  }
}
