import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LanguagesResponseSchema, type LanguagesResponse } from '@shared/types';
import { LanguagesService } from '../services/languages.service';

@ApiTags('languages')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languages: LanguagesService) {}

  @Get()
  @ApiOperation({ summary: 'List supported languages' })
  @ApiResponse({ status: 200, description: 'Array of languages' })
  async list(): Promise<LanguagesResponse> {
    const records = await this.languages.findAll();
    return LanguagesResponseSchema.parse(records);
  }
}
