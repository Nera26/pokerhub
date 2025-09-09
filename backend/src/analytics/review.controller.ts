import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CollusionService } from './collusion.service';
import { FlaggedSessionsQuerySchema } from '@shared/types';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@ApiTags('collusion')
@Controller('analytics/collusion')
export class ReviewController {
  constructor(private readonly collusion: CollusionService) {}

  @Get('flagged')
  @ApiOperation({ summary: 'List flagged sessions' })
  @ApiResponse({ status: 200, description: 'Flagged sessions' })
  async list(@Query() query: unknown) {
    const { page, status } = FlaggedSessionsQuerySchema.parse(query);
    return this.collusion.listFlaggedSessions({ page, status });
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get session audit log' })
  @ApiResponse({ status: 200, description: 'Audit entries' })
  async audit(@Param('id') id: string) {
    return this.collusion.getActionHistory(id);
  }
}
