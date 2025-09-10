import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CollusionService } from './collusion.service';
import { AnalyticsService } from './analytics.service';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@ApiTags('collusion')
@Controller('analytics/collusion')
export class CollusionController {
  constructor(
    private readonly collusion: CollusionService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Post(':sessionId/:action')
  @ApiOperation({ summary: 'Record collusion action' })
  @ApiResponse({ status: 200, description: 'Action recorded' })
  async record(
    @Param('sessionId') sessionId: string,
    @Param('action') action: 'warn' | 'restrict' | 'ban',
    @Req() req: any,
  ) {
    const reviewerId = req.userId;
    const entry = await this.collusion.applyAction(
      sessionId,
      action,
      reviewerId,
    );
    await this.analytics.ingest('collusion_audit', {
      session_id: sessionId,
      reviewer_id: entry.reviewerId,
      action: entry.action,
      timestamp: entry.timestamp,
    });
    return entry;
  }
}

