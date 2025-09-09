import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  LanguagesResponse,
  LanguagesResponseSchema,
} from '../schemas/languages';

const LANGUAGES: LanguagesResponse = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

@ApiTags('languages')
@Controller('languages')
export class LanguagesController {
  @Get()
  @ApiOperation({ summary: 'List supported languages' })
  @ApiResponse({ status: 200, description: 'Array of languages' })
  list(): LanguagesResponse {
    return LanguagesResponseSchema.parse(LANGUAGES);
  }
}
