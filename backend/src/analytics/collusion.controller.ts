import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CollusionService } from './collusion.service';
import { AnalyticsService } from './analytics.service';
import { ReviewActionSchema } from '../schemas/review';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@Controller('analytics/collusion')
export class CollusionController {
  constructor(
    private readonly collusion: CollusionService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Post(':sessionId/:action')
  async record(
    @Param('sessionId') sessionId: string,
    @Param('action') action: string,
    @Req() req: any,
  ) {
    const parsed = ReviewActionSchema.parse(action);
    const reviewerId = req.userId;
    const timestamp = Date.now();
    await this.collusion.applyAction(sessionId, parsed, reviewerId);
    await this.analytics.ingest('collusion_audit', {
      session_id: sessionId,
      reviewer_id: reviewerId,
      action: parsed,
      timestamp,
    });
    return { message: parsed };
  }
}

