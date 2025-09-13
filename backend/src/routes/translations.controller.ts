import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LanguageSchema } from '@shared/types';
import { CACHE_TTL, TranslationsService } from '../services/translations.service';
import {
  TranslationsResponse,
  TranslationsResponseSchema,
} from '../schemas/translations';

@ApiTags('translations')
@Controller('translations')
export class TranslationsController {
  constructor(private readonly translations: TranslationsService) {}

  @Get(':locale')
  @Header('Cache-Control', `public, max-age=${CACHE_TTL}`)
  @ApiOperation({ summary: 'Get translations for a language' })
  @ApiResponse({ status: 200, description: 'Translation messages' })
  async get(@Param('locale') locale: string): Promise<TranslationsResponse> {
    const { code } = LanguageSchema.pick({ code: true }).parse({ code: locale });
    const messages = await this.translations.get(code);
    return TranslationsResponseSchema.parse({ messages });
  }
}
