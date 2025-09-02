import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CollusionService } from './collusion.service';
import { FlaggedSessionsQuerySchema } from '../schemas/review';
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

  @Get(':id/audit')
  async audit(@Param('id') id: string) {
    return this.collusion.getActionHistory(id);
  }
}
