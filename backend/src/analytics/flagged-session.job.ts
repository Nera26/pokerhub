import { Injectable } from '@nestjs/common';
import { CollusionService } from './collusion.service';
import { FlaggedSession } from '../schemas/review';

@Injectable()
export class FlaggedSessionJob {
  private sessions: FlaggedSession[] = [];

  constructor(private readonly collusion: CollusionService) {
    void this.refresh();
    setInterval(() => void this.refresh(), 60_000);
  }

  private async refresh() {
    this.sessions = await this.collusion.listFlaggedSessions();
  }

  getSessions(): FlaggedSession[] {
    return this.sessions;
  }
}
