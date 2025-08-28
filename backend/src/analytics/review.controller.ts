import { Controller, Get, Param, Post } from '@nestjs/common';
import { CollusionService } from './collusion.service';
import { FlaggedSessionJob } from './flagged-session.job';
import { ReviewActionSchema } from '../schemas/review';

@Controller('review')
export class ReviewController {
  constructor(
    private readonly collusion: CollusionService,
    private readonly job: FlaggedSessionJob,
  ) {}

  @Get('sessions')
  async list() {
    return this.job.getSessions();
  }

  @Post('sessions/:id/:action')
  async act(@Param('id') id: string, @Param('action') action: string) {
    const parsed = ReviewActionSchema.parse(action);
    await this.collusion.applyAction(id, parsed);
    return { message: parsed };
  }
}
