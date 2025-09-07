import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CTAsResponseSchema, type CTAsResponse } from '@shared/types';

@ApiTags('lobby')
@Controller('ctas')
export class CtasController {
  @Get()
  @ApiOperation({ summary: 'Get lobby CTAs' })
  @ApiResponse({ status: 200, description: 'CTA list' })
  getCtas(): CTAsResponse {
    return CTAsResponseSchema.parse([
      {
        id: 'join-table',
        label: 'Join a Live Table',
        href: '#cash-games-panel',
        variant: 'primary',
      },
      {
        id: 'view-tournaments',
        label: 'View Tournaments',
        href: '#tournaments-panel',
        variant: 'outline',
      },
    ]);
  }
}
