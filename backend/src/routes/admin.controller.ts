import { Controller, Get } from '@nestjs/common';
import { FlaggedSessionJob } from '../analytics/flagged-session.job';

@Controller('admin')
export class AdminController {
  constructor(private readonly job: FlaggedSessionJob) {}

  @Get('flagged-sessions')
  listFlagged() {
    return this.job.getSessions();
  }
}
