import { Controller, Get, Post, Param } from '@nestjs/common';
import { CollusionService } from '../analytics/collusion.service';
import { ReviewActionSchema } from '../schemas/review';

@Controller('review')
export class ReviewController {
  constructor(private readonly collusion: CollusionService) {}

  @Get('sessions')
  async list() {
    return this.collusion.listFlaggedSessions();
  }

  @Post('sessions/:id/:action')
  async act(
    @Param('id') id: string,
    @Param('action') action: string,
  ) {
    const parsed = ReviewActionSchema.parse(action);
    await this.collusion.applyAction(id, parsed);
    return { message: parsed };
  }
}
