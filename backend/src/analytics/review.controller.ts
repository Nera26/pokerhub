import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CollusionService } from './collusion.service';
import { ReviewActionSchema, FlaggedSessionsQuerySchema } from '../schemas/review';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(AdminGuard)
@Controller('analytics/collusion')
export class ReviewController {
  constructor(private readonly collusion: CollusionService) {}

  @Get('flagged')
  async list(@Query() query: unknown) {
    const { page, status } = FlaggedSessionsQuerySchema.parse(query);
    return this.collusion.listFlaggedSessions({ page, status });
  }

  @Post(':id/:action')
  async act(@Param('id') id: string, @Param('action') action: string) {
    const parsed = ReviewActionSchema.parse(action);
    await this.collusion.applyAction(id, parsed);
    return { message: parsed };
  }
}
