import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CollusionService } from './collusion.service';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@ApiTags('collusion')
@Controller('analytics/collusion')
export class ReviewController {
  constructor(private readonly collusion: CollusionService) {}

  @Get('flagged')
  @ApiOperation({ summary: 'List flagged sessions' })
  @ApiResponse({ status: 200, description: 'Flagged sessions' })
  async list(@Query('page') page = '1', @Query('status') status?: string) {
    const pageNum = Number(page);
    return this.collusion.listFlaggedSessions({
      page: Number.isNaN(pageNum) ? 1 : pageNum,
      status: status as any,
    });
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get session audit log' })
  @ApiResponse({ status: 200, description: 'Audit entries' })
  async audit(@Param('id') id: string) {
    return this.collusion.getActionHistory(id);
  }
}
